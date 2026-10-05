package com.sahyatri.common.config;

/**
 * Where this instance runs (`APP_ENV`). Staging and production are "deployed": {@link DeploymentGuard} refuses to
 * start them on development defaults. Staging takes Razorpay test keys only, production live keys only.
 */
public enum AppEnvironment {
    DEVELOPMENT, STAGING, PRODUCTION;

    public boolean isDeployed() {
        return this != DEVELOPMENT;
    }
}
