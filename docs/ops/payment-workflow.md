# MotionCode Payment Workflow

## Runtime Flow

1. A signed-in user opens `/pricing`.
2. `/api/razorpay/checkout` creates a Razorpay subscription and returns Checkout options.
3. Razorpay Checkout returns `razorpay_payment_id`, `razorpay_subscription_id`, and `razorpay_signature` to the browser.
4. The browser posts those values to `/api/razorpay/verify`; the server verifies the signature before updating entitlement state.
5. Razorpay webhooks keep `subscriptions` and `profiles.plan_tier` in sync for later updates, cancellations, and status changes.
6. Application authorization reads only trusted Supabase rows through `getEntitlementSummary`.

## Required Environment Variables

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `RAZORPAY_PRO_PLAN_ID`
- `RAZORPAY_STUDIO_PLAN_ID`
- `RAZORPAY_SUBSCRIPTION_TOTAL_COUNT`

## Razorpay Production Setup

1. Create or activate the Razorpay account and complete business/KYC verification.
2. Create recurring subscription Plans for Pro and Studio.
3. Copy the Plan IDs into `RAZORPAY_PRO_PLAN_ID` and `RAZORPAY_STUDIO_PLAN_ID`.
4. Choose `RAZORPAY_SUBSCRIPTION_TOTAL_COUNT`; for monthly subscriptions, `120` means 10 years of monthly billing cycles.
5. Add a webhook endpoint:
   - Staging: `https://staging.example.com/api/razorpay/webhook`
   - Production: `https://your-domain.com/api/razorpay/webhook`
6. Enable subscription webhook events that include the subscription entity payload, including authenticated/activated/cancelled status changes.
7. Copy the webhook signing secret into `RAZORPAY_WEBHOOK_SECRET`.
8. Run a test subscription checkout and confirm:
   - `/api/razorpay/verify` succeeds after Checkout
   - `subscriptions.payment_provider = 'razorpay'`
   - `subscriptions.razorpay_subscription_id` is populated
   - `profiles.plan_tier` upgrades only after signature verification
   - a cancelled subscription webhook returns the profile to `free`

## Release Discipline

- Keep all payment secrets server-only; never prefix them with `NEXT_PUBLIC_`.
- Configure test-mode and live-mode variables separately.
- Apply Supabase migrations before deploying payment code.
- Verify Razorpay in staging before live traffic.
- Rotate webhook secrets if they are exposed or copied into the wrong environment.
- Keep pricing copy, Razorpay Plans, and `PLAN_ENTITLEMENTS` aligned before launch.
