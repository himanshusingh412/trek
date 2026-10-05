/**
 * Business details shown on the Contact, Terms and Privacy pages — the only place they are written. Razorpay checks
 * these before issuing live keys, and Indian consumer and data-protection rules expect them to be real.
 *
 * LAUNCH-BLOCKING: a value written as `[…]` is a placeholder. A production build fails while any remain
 * (vite.config.ts `requireBusinessDetails`), unless ALLOW_PLACEHOLDER_BUSINESS_DETAILS=true is set on purpose.
 * Replace each with the registered details from the owner; never with a guess. List: docs/LAUNCH-READINESS.md.
 */
export const BUSINESS = {
  /** As registered (company or proprietorship); Terms and Privacy name it when it differs from the brand. */
  legalName: 'The Empty Valley',
  /** Registered address; also used for the grievance officer. Terms put jurisdiction in Mumbai courts. */
  address: '[Registered address], Mumbai, Maharashtra, India',
  supportEmail: 'info@theemptyvalley.com',
  /** E.164 with spaces, e.g. "+91 98765 43210"; the Contact page dials it. */
  supportPhone: '+91 [support number]',
  supportHours: 'Monday to Saturday, 10 am – 7 pm IST',
  grievanceOfficer: '[Grievance officer name]',
  grievanceEmail: 'info@theemptyvalley.com',
  lastUpdated: '5 October 2026',
}
