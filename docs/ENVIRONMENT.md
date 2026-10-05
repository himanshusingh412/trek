# Environments and configuration

Every variable the system reads, and what it must be in each environment. Values here are examples or rules, never
real secrets. Real secrets live in AWS Secrets Manager (`emptyvalley/prod`, the RDS-managed secret) and never in git.
The backend reads the repo-root `.env` locally (`.env.example` is the template); real environment variables win.

## The three environments

`APP_ENV` picks one. `development` is the default, so a laptop needs nothing set.

| | Development (`APP_ENV=development`) | Staging (`APP_ENV=staging`) | Production (`APP_ENV=production`) |
|---|---|---|---|
| Where | a laptop: `docker compose` Postgres, `./mvnw spring-boot:run`, `npm run dev` | a deployed copy for testing (not built yet; see docs/DEPLOY.md) | ECS Fargate + RDS + S3 + SES, site on Firebase Hosting |
| Startup check | Razorpay checks and warnings only | full check (below) | full check (below) |
| Email | `log` (printed) or `ses` | `ses` | `ses` |
| SMS | `log` (printed), `disabled` or `msg91` | `disabled` or `msg91` | `disabled` until DLT, then `msg91` |
| Razorpay | none, or **test** keys (`rzp_test_`); webhook optional | **test** keys + test webhook secret | **live** keys (`rzp_live_`) + live webhook secret, or none (payments off) |
| Database | local Postgres (compose, port 5433) | its own database, never production's | RDS (`sslmode=require`) |
| File storage | `local` (`./data/uploads`) | `s3` | `s3` |
| Debug logging | allowed | refused for request/SQL loggers | refused for request/SQL loggers |
| Sensitive values in logs | never (dev log providers print emails/OTPs by design, locally only) | never | never |

**Tests** run as development against a throwaway Postgres (Testcontainers) with SMS, email and Google mocked and a fake
Razorpay gateway (`payment/FakePaymentGateway`): no external service is ever called. Rate limiting is off in the
shared test context.

### The startup check (staging and production)

`common/config/DeploymentGuard` runs before the database pool, Flyway or the web server start. If anything is wrong it
stops the process and lists every problem, each marked **Missing** (not set) or **Invalid** (set to something unsafe).
It prints variable names, never values. On ECS a failed start exits before migrating; the circuit breaker keeps the
previous task serving.

Development is never blocked except for unsafe Razorpay key combinations (live keys outside production, a key id
without its secret).

## Backend variables

"Required" = must be set explicitly when deployed; the development default is refused there.

| Variable | Development (default) | Staging / Production | Secret? | Required when deployed? |
|---|---|---|---|---|
| `APP_ENV` | `development` | `staging` / `production` | no | yes |
| `PORT` | `8081` | `8081` (container port) | no | no |
| `DB_URL` | `jdbc:postgresql://localhost:5433/sahyatri` | RDS JDBC URL with `?sslmode=require` | no | yes |
| `DB_USER` | `sahyatri` | the RDS user | no | yes |
| `DB_PASSWORD` | `sahyatri` (compose) | from the RDS-managed secret; the compose default is refused | **yes** | yes |
| `DB_POOL_SIZE` | `10` | `10` (RDS t4g.micro allows ~80 connections) | no | no |
| `JWT_SECRET` | dev placeholder | random, ≥ 32 bytes (`openssl rand -base64 48`); placeholders refused | **yes** | yes |
| `AUTH_COOKIE_SECURE` | `false` | `true` | no | yes |
| `GOOGLE_CLIENT_ID` | blank (Google sign-in off) | the OAuth client id (public) | no | no |
| `PUBLIC_BASE_URL` | `http://localhost:8081` | `https://api.theemptyvalley.com` (public https) | no | yes |
| `FRONTEND_BASE_URL` | `http://localhost:5173` | `https://theemptyvalley.com` (public https) | no | yes |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | exact https origins, comma-separated; no `*`, no localhost | no | yes |
| `STORAGE_TYPE` | `local` | `s3` | no | yes |
| `UPLOAD_DIR` | `./data/uploads` | unused | no | no |
| `S3_UPLOADS_BUCKET` | blank | the uploads bucket | no | yes (with `s3`) |
| `AWS_REGION` | `ap-south-1` | `ap-south-1` (read by the AWS SDK; credentials from the ECS task role) | no | — |
| `MAIL_PROVIDER` | `log` | `ses` | no | yes |
| `MAIL_FROM` | `The Empty Valley <no-reply@sahyatri.local>` | an address on the SES-verified domain | no | yes |
| `SMS_PROVIDER` | `log` | `disabled` or `msg91`; `log` refused | no | yes |
| `MSG91_AUTH_KEY` | blank | MSG91 auth key | **yes** | with `msg91` |
| `MSG91_OTP_TEMPLATE_ID` | blank | DLT-approved template using `##otp##` | no | with `msg91` |
| `RATE_LIMIT_ENABLED` | `true` | `true` (off is refused) | no | — |
| `RATE_LIMIT_CLIENT_IP_HEADER` | blank (socket address) | `X-Forwarded-For` behind the ALB (`CloudFront-Viewer-Address` on CloudFront) | no | yes |
| `ADMIN_EMAILS` | blank | accounts made ADMIN at startup | no | no |
| `GUIDE_SHARE_BPS` | `7000` | business decision | no | no |
| `CHARITY_NAME` / `CHARITY_BPS` | blank / `100` | business decision (blank name hides it) | no | no |
| `BOOKING_HOLD_TTL` | `10m` | `10m` (≥ 2m) | no | no |
| `RAZORPAY_KEY_ID` | blank or `rzp_test_…` | staging `rzp_test_…`, production `rzp_live_…`; the only key sent to browsers | no (public) | with payments |
| `RAZORPAY_KEY_SECRET` | blank or test secret | matching secret | **yes** | with payments |
| `RAZORPAY_WEBHOOK_SECRET` | optional | the secret typed when registering the webhook (test and live differ) | **yes** | with payments |

Blank Razorpay keys leave payments off: creating an order returns `502 GATEWAY_UNAVAILABLE`. Production without keys
starts with a warning.

## Frontend build variables (Vite)

Everything prefixed `VITE_` is compiled into the public JavaScript bundle. **Never put a secret in a `VITE_` variable.**
Razorpay's key id doesn't need one: the backend returns it with each order.

| Variable | Development | Production build | Notes |
|---|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8081` (dev server falls back to it) | `https://api.theemptyvalley.com`; `''` only when site and API share an origin | a production build fails without it, or with plain http to a non-local host |
| `VITE_GOOGLE_CLIENT_ID` | blank hides Google sign-in | the OAuth client id (public) | same value as `GOOGLE_CLIENT_ID` |
| `VITE_PHONE_OTP` | blank | blank until the backend runs `SMS_PROVIDER=msg91`, then `true` | shows phone sign-in |
| `ALLOW_PLACEHOLDER_BUSINESS_DETAILS` | — | unset; `true` only while `src/lib/business.ts` still has `[…]` placeholders | not exposed to the browser; without it a production build fails on placeholders |

## GitHub Actions

Repository **variables** (not secrets; nothing secret is stored in GitHub — deploys use OIDC):
`AWS_ROLE_ARN`, `ECR_REPOSITORY`, `ECS_CLUSTER`, `ECS_SERVICE`, `ECS_TASK_FAMILY`, `ECS_CONTAINER`,
`VITE_API_BASE_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_PHONE_OTP`, `FIREBASE_PROJECT`, `GCP_WORKLOAD_IDENTITY_PROVIDER`,
`GCP_SERVICE_ACCOUNT`, and temporarily `ALLOW_PLACEHOLDER_BUSINESS_DETAILS`.

CI (`ci.yml`) builds the frontend with a dummy `VITE_API_BASE_URL` and `ALLOW_PLACEHOLDER_BUSINESS_DETAILS=true`:
it's a check, never deployed. `deploy.yml` uses the real variables.

## docker-compose only

`DB_NAME`, `DB_PORT` (and `DB_USER`, `DB_PASSWORD`) configure the local Postgres container.
