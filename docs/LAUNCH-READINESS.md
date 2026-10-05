# Launch readiness: what only the owner can provide

Engineering can't invent these. Each is needed before Razorpay's live-mode website review and before taking real
money. Nothing here is legal advice, and nothing in the code claims legal compliance: have the Terms, Privacy and
Cancellations pages reviewed by someone qualified.

## 1. Business details (`frontend/src/lib/business.ts`)

The only place these are written. A production build fails while any `[…]` placeholder remains, unless
`ALLOW_PLACEHOLDER_BUSINESS_DETAILS=true` is set on purpose (docs/ENVIRONMENT.md).

| Field | Now | Needed |
|---|---|---|
| `legalName` | `The Empty Valley` | The registered name (company, LLP or proprietor). If it differs from the brand, Terms and Privacy say "operated by …" automatically. |
| `address` | **`[Registered address]`**, Mumbai, Maharashtra, India | The full registered address. Shown on Contact and as the grievance officer's address. |
| `supportPhone` | **`+91 [support number]`** | A support phone / WhatsApp number (E.164, e.g. `+91 98765 43210`). The Contact page links it with `tel:`. |
| `grievanceOfficer` | **`[Grievance officer name]`** | The named grievance officer for personal data (privacy policy). |
| `supportEmail`, `grievanceEmail` | `info@theemptyvalley.com` | Confirm this inbox is monitored (grievances promise a reply within 30 days). |
| `supportHours` | Monday–Saturday, 10 am – 7 pm IST | Confirm. |
| `lastUpdated` | 5 October 2026 | Change whenever Terms or Privacy change. |

## 2. Decisions and documents for Razorpay and tax

- **Company registration** and its documents: PAN, bank account, and GSTIN if registered (Razorpay KYC).
- **GST treatment** of trek fees and add-ons. Terms say prices "include applicable taxes unless stated otherwise",
  but the system issues no tax invoice. Decide whether GST applies, the rate, and whether a GST invoice is required —
  that decides whether an invoice feature is needed before launch.
- **Jurisdiction:** Terms name the courts in Mumbai. Confirm it matches the registered address.
- **Razorpay test keys** (`rzp_test_…`, secret, and a test webhook secret) to exercise payments end to end before live
  mode. Live keys come only after KYC and the website review.
- **SMS:** TRAI DLT registration, then MSG91 auth key and a DLT-approved OTP template. Until then production runs
  `SMS_PROVIDER=disabled` and phone sign-in stays hidden.

## 3. Where the published pages and the app disagree

Found by reading the Terms, Privacy, Contact and Cancellations pages against what the code does. Each needs a
business decision (change the wording, or build the behaviour); none was changed here.

1. **Credit notes can't be issued.** The Cancellations page offers a credit note (100% / 80% / 30%) "if you write to
   us before you cancel and we'll cancel the booking for you", and a 100% credit note when we cancel. The system has
   no credit notes, and no admin action can cancel a paid booking (only the trekker, or a force-majeure cancellation
   of the whole departure, which refunds cash automatically). Today support can't honour this promise without a
   database change.
2. **"Your guide sees the safety details for their departure"** (Privacy, *Why we use it*). Guides have no access to
   bookings or traveller details in the app yet. Either build the guide's departure roster or reword.
3. **Erasure on request** (Privacy, *Your rights*). There's no tool to erase or anonymise an account; bookings and
   payments are kept 8 years by the same policy. Requests would be handled by hand in the database. Decide the
   process (and what "erase" means for kept booking records) before promising a 30-day turnaround.
4. **The repeat-trek offer** (Cancellations, *If weather stops the summit push*: repeat within a year at direct
   cost) has no support in the system; it's a manual promise.
5. **Guest checkout creates an account.** Booking without signing up creates a guest account holding the name,
   WhatsApp number and email. The privacy policy's *What we collect* covers the data but not that an account is made.
6. **IP addresses.** Privacy says IP addresses and request logs are kept for security. The app doesn't store IPs;
   the load balancer and CloudWatch logs may. Confirm the retention you state matches the AWS settings (logs: 30 days).
7. **Taxes** — see section 2.
8. **Refund tiers are written twice:** on the Cancellations page (`REFUND_TIERS` in `pages/InfoPages.tsx`) and in the
   backend config (`app.bookings.refund-tiers`), which is what bookings actually freeze. They match today (90% at 31+
   days, 50% at 15–30, none under 15); a change must update both.

Consistent with the app (checked): the 10-minute seat hold, "we never see your card details" (Razorpay Checkout),
refunds to the original payment method, full refund when we cancel, no cancellation for low numbers, ages 12+ with a
parent or guardian on the same booking, accounts 18+, one sign-in cookie, Google sign-in data.

## 4. Infrastructure still to set up (docs/DEPLOY.md)

- `APP_ENV=production` and `SMS_PROVIDER=disabled` in the ECS task definition (one new revision, together).
- Razorpay keys and webhook secret in `emptyvalley/prod` and the task definition's `secrets`, plus the webhook
  registered at `https://api.theemptyvalley.com/api/webhooks/razorpay` — test mode first, live after approval.
- A staging environment (decision pending) so payments can be tested once production holds live keys.
- Firebase Blaze plan; AWS Activate credits.
