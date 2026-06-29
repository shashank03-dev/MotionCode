# MotionCode — Auth email setup

Production-grade SMTP + branded email templates for Supabase Auth.

> Supabase's **built-in** email service is rate-limited to a few messages per
> hour and is **not** for production — magic links and signups will silently
> fail under any real traffic. You must configure a custom SMTP provider.

---

## 1. Choose an SMTP provider

| Provider | Cost | From address | Recommendation |
|---|---|---|---|
| **Resend** | Free: 3,000/mo, 100/day | `noreply@motioncode.live` | ✅ **Use this.** True production deliverability, send from your own domain. |
| Gmail + App Password | Free, ~500/day | `you@gmail.com` only | Fine for testing only. Can't send from `@motioncode.live`; lands in spam more often. |

### Recommended: Resend
1. Create an account at https://resend.com and **add the domain `motioncode.live`**.
2. Add the **SPF, DKIM, and DMARC** DNS records Resend gives you at your registrar. Wait for "Verified" — this is what keeps mail out of spam.
3. Create an **API key** (Sending access).
4. In **Supabase → Project → Authentication → Emails → SMTP Settings**, enable custom SMTP and enter:

   | Field | Value |
   |---|---|
   | Sender email | `noreply@motioncode.live` |
   | Sender name | `MotionCode` |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | *(your Resend API key)* |

### Fallback: Gmail (testing only)
Use a [Google App Password](https://myaccount.google.com/apppasswords) (not your normal password):

| Field | Value |
|---|---|
| Sender email | `<your-gmail>@gmail.com` |
| Sender name | `MotionCode` |
| Host | `smtp.gmail.com` |
| Port | `587` |
| Username | `<your-gmail>@gmail.com` |
| Password | *(16-char App Password)* |

---

## 2. Raise the email rate limit
**Supabase → Authentication → Rate Limits** → set "Emails per hour" appropriately
(the default low cap exists for the built-in sender; with custom SMTP you can raise it).

---

## 3. Install the templates
**Supabase → Authentication → Emails → Templates.** For each template below, paste
the matching HTML file's contents into the **Message body (HTML)** field and set the
**Subject**:

| Supabase template | File | Subject line |
|---|---|---|
| Magic Link | `magic-link.html` | `Sign in to MotionCode` |
| Confirm signup | `confirm-signup.html` | `Confirm your email — MotionCode` |
| Reset Password | `reset-password.html` | `Reset your MotionCode password` |
| Change Email Address | `change-email.html` | `Confirm your new email — MotionCode` |
| Invite user | `invite.html` | `You're invited to MotionCode` |

> Tip: keep subjects free of spammy words ("free", "!!!") to protect deliverability.

---

## 4. Template variables (Supabase Go templates)
These are filled in automatically by Supabase:

| Variable | Meaning |
|---|---|
| `{{ .ConfirmationURL }}` | The action link (sign in / confirm / reset). |
| `{{ .Email }}` | Recipient's current email. |
| `{{ .NewEmail }}` | New address (change-email only). |
| `{{ .SiteURL }}` | Your configured Site URL. |
| `{{ .Token }}` | 6-digit OTP code (if you switch a flow to OTP). |

---

## 5. Verify before relying on it
1. Trigger each email (sign in, reset password, etc.) to a real inbox.
2. Confirm it **lands in the inbox, not spam** (this is the deliverability check).
3. Confirm the button works and renders on **mobile + Gmail + Outlook**.
4. The link domain will still show `*.supabase.co` until you add a Supabase
   custom domain (Pro feature) — cosmetic only, the ref is already public.

---

## Design notes
Templates match the MotionCode brand: warm near-black background (`#11120D`),
bone accent (`#D8CFBC`), off-white text (`#FFFBF4`), mono wordmark. They use
email-safe table layout with inline styles, a bulletproof (Outlook VML) button,
hidden preheader text, and a plaintext link fallback.
