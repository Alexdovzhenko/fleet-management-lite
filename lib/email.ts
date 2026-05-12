import { Resend } from "resend"

// Lazy-initialize so the module loads even when RESEND_API_KEY is not set.
// The caller checks for the key before invoking sendEmailWithPdf.
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? "missing")
  return _resend
}

// Platform-level sender. This address must be verified in Resend.
// Company sender email is used as replyTo so replies go to the company.
const PLATFORM_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@liveryconnect.com"
const PLATFORM_FROM_NAME  = process.env.RESEND_FROM_NAME  ?? "Livery Connect"

export interface SendEmailOptions {
  to: string
  replyTo?: string         // company's selected sender email
  fromLabel?: string       // company name
  subject: string
  html: string
  pdfBuffer: Buffer
  pdfFilename: string
}

export async function sendEmailWithPdf({
  to,
  replyTo,
  fromLabel,
  subject,
  html,
  pdfBuffer,
  pdfFilename,
}: SendEmailOptions) {
  const fromName = fromLabel ? `${fromLabel} via Livery Connect` : PLATFORM_FROM_NAME
  const from = `${fromName} <${PLATFORM_FROM_EMAIL}>`

  return getResend().emails.send({
    from,
    to,
    replyTo: replyTo ?? undefined,
    subject,
    html,
    attachments: [
      {
        filename: pdfFilename,
        content: pdfBuffer,
      },
    ],
  })
}

// ─── Email HTML templates ────────────────────────────────────────────────────

export function buildDriverEmailHtml(params: {
  companyName: string
  tripNumber: string
  pickupDate: string
  pickupTime: string
  pickupAddress: string
  dropoffAddress: string
  passengerName: string
  driverName?: string
}) {
  const { companyName, tripNumber, pickupDate, pickupTime, pickupAddress, dropoffAddress, passengerName, driverName } = params

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:540px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#0f172a;padding:20px 28px;display:flex;align-items:center;justify-content:space-between;">
      <span style="color:#ffffff;font-size:16px;font-weight:700;">${companyName}</span>
      <span style="background:#1e3a8a;color:#93c5fd;font-size:10px;font-weight:700;letter-spacing:1px;padding:4px 10px;border-radius:20px;">JOB ORDER</span>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Trip Confirmation</p>
      <p style="margin:0 0 24px;font-size:28px;font-weight:800;color:#0f172a;font-family:monospace;letter-spacing:2px;">${tripNumber}</p>

      ${driverName ? `<p style="margin:0 0 20px;font-size:14px;color:#475569;">Hi <strong>${driverName}</strong>, here is your job order. Please find the full details attached as a PDF.</p>` : ''}

      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <div>
            <p style="margin:0;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;">Date</p>
            <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#0f172a;">${pickupDate}</p>
          </div>
          <div>
            <p style="margin:0;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;">Pickup Time</p>
            <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#0f172a;">${pickupTime}</p>
          </div>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;">Pickup</p>
        <p style="margin:0;font-size:14px;color:#1e293b;font-weight:500;">${pickupAddress}</p>
      </div>

      <div style="margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;">Drop-off</p>
        <p style="margin:0;font-size:14px;color:#1e293b;font-weight:500;">${dropoffAddress}</p>
      </div>

      <div style="margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;">Passenger</p>
        <p style="margin:0;font-size:14px;color:#1e293b;font-weight:500;">${passengerName || "Not specified"}</p>
      </div>

      <p style="margin:0;font-size:13px;color:#64748b;">Full job details are attached as a PDF. Contact dispatch if you have any questions.</p>
    </div>
    <div style="background:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">Sent via Livery Connect · For driver use only</p>
    </div>
  </div>
</body>
</html>`
}

export function buildClientEmailHtml(params: {
  companyName: string
  tripNumber: string
  pickupDate: string
  pickupTime: string
  pickupAddress: string
  dropoffAddress: string
  passengerName: string
  totalPrice?: string
  companyPhone?: string
}) {
  const { companyName, tripNumber, pickupDate, pickupTime, pickupAddress, dropoffAddress, passengerName, totalPrice, companyPhone } = params

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:540px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#1e3a8a;padding:24px 28px;">
      <p style="margin:0 0 2px;font-size:18px;font-weight:800;color:#ffffff;">${companyName}</p>
      <p style="margin:0;font-size:12px;color:#93c5fd;">Reservation Confirmation</p>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Confirmation Number</p>
      <p style="margin:0 0 28px;font-size:28px;font-weight:800;color:#1e3a8a;font-family:monospace;letter-spacing:2px;">${tripNumber}</p>

      <p style="margin:0 0 20px;font-size:14px;color:#475569;">Hi ${passengerName || "there"},<br/>Your reservation has been confirmed. Please find the full details attached.</p>

      <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
        <div style="background:#f8fafc;padding:12px 16px;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Trip Details</p>
        </div>
        <div style="padding:16px;">
          <div style="margin-bottom:14px;">
            <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;">Date &amp; Time</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">${pickupDate} · ${pickupTime}</p>
          </div>
          <div style="margin-bottom:14px;">
            <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;">Pickup</p>
            <p style="margin:0;font-size:14px;color:#1e293b;">${pickupAddress}</p>
          </div>
          <div style="${totalPrice ? 'margin-bottom:14px;' : ''}">
            <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;">Drop-off</p>
            <p style="margin:0;font-size:14px;color:#1e293b;">${dropoffAddress}</p>
          </div>
          ${totalPrice ? `
          <div style="border-top:1px solid #e2e8f0;padding-top:14px;">
            <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;">Total</p>
            <p style="margin:0;font-size:18px;font-weight:800;color:#0f172a;">${totalPrice}</p>
          </div>` : ''}
        </div>
      </div>

      <p style="margin:0;font-size:13px;color:#64748b;">Full reservation details are attached as a PDF. Contact us if you need to make any changes.</p>
    </div>
    <div style="background:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">${companyName}${companyPhone ? ` · ${companyPhone}` : ''}</p>
    </div>
  </div>
</body>
</html>`
}

export function buildAffiliateEmailHtml(params: {
  companyName: string
  tripNumber: string
  pickupDate: string
  pickupTime: string
  pickupAddress: string
  dropoffAddress: string
  passengerCount: number
  agreedPrice?: string
}) {
  const { companyName, tripNumber, pickupDate, pickupTime, pickupAddress, dropoffAddress, passengerCount, agreedPrice } = params

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:540px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#312e81;padding:20px 28px;display:flex;align-items:center;justify-content:space-between;">
      <span style="color:#ffffff;font-size:16px;font-weight:700;">${companyName}</span>
      <span style="background:#4338ca;color:#c7d2fe;font-size:10px;font-weight:700;letter-spacing:1px;padding:4px 10px;border-radius:20px;">AFFILIATE JOB</span>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Trip Reference</p>
      <p style="margin:0 0 24px;font-size:28px;font-weight:800;color:#312e81;font-family:monospace;letter-spacing:2px;">${tripNumber}</p>

      <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
        <div style="background:#f8fafc;padding:12px 16px;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Job Details</p>
        </div>
        <div style="padding:16px;">
          <div style="margin-bottom:14px;">
            <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;">Date &amp; Time</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">${pickupDate} · ${pickupTime}</p>
          </div>
          <div style="margin-bottom:14px;">
            <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;">Pickup</p>
            <p style="margin:0;font-size:14px;color:#1e293b;">${pickupAddress}</p>
          </div>
          <div style="margin-bottom:14px;">
            <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;">Drop-off</p>
            <p style="margin:0;font-size:14px;color:#1e293b;">${dropoffAddress}</p>
          </div>
          <div style="${agreedPrice ? 'margin-bottom:14px;' : ''}">
            <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;">Passengers</p>
            <p style="margin:0;font-size:14px;color:#1e293b;">${passengerCount} passenger${passengerCount !== 1 ? 's' : ''}</p>
          </div>
          ${agreedPrice ? `
          <div style="border-top:1px solid #e2e8f0;padding-top:14px;">
            <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;">Agreed Rate</p>
            <p style="margin:0;font-size:18px;font-weight:800;color:#312e81;">${agreedPrice}</p>
          </div>` : ''}
        </div>
      </div>

      <p style="margin:0;font-size:13px;color:#64748b;">Full reservation details are attached. Please review and contact us with any questions.</p>
    </div>
    <div style="background:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">Sent via Livery Connect · Affiliate Communication</p>
    </div>
  </div>
</body>
</html>`
}

// ─── Password Reset Email ────────────────────────────────────────────────────

export function buildPasswordResetEmailHtml(params: {
  resetUrl: string
  expiresInMinutes?: number
}) {
  const { resetUrl, expiresInMinutes = 60 } = params
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="color-scheme" content="light dark"/>
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#0a0e18;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <!-- Preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Reset your Livery Connect password — link expires in ${expiresInMinutes} minutes.</div>
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">&#847;&zwnj;&nbsp;</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0e18;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

          <!-- Logo / Brand header -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:0 12px;">
                    <div style="width:64px;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,124,0.55));"></div>
                  </td>
                  <td>
                    <span style="font-size:10px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:#c9a87c;white-space:nowrap;">Livery Connect</span>
                  </td>
                  <td style="padding:0 12px;">
                    <div style="width:64px;height:1px;background:linear-gradient(90deg,rgba(201,168,124,0.55),transparent);"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:rgba(14,19,34,0.98);border:1px solid rgba(201,168,124,0.13);border-radius:16px;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.6);">

              <!-- Card top accent -->
              <div style="height:3px;background:linear-gradient(90deg,rgba(201,168,124,0.0) 0%,rgba(201,168,124,0.7) 50%,rgba(201,168,124,0.0) 100%);"></div>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:40px 40px 32px;">

                    <!-- Icon -->
                    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:rgba(201,168,124,0.1);border:1px solid rgba(201,168,124,0.2);border-radius:14px;width:52px;height:52px;text-align:center;vertical-align:middle;">
                          <span style="font-size:24px;line-height:52px;">🔐</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Heading -->
                    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f1f5f9;letter-spacing:-0.02em;line-height:1.2;">Reset your password</h1>
                    <p style="margin:0 0 28px;font-size:15px;color:#94a3b8;line-height:1.6;">
                      We received a request to reset the password for your Livery Connect account. Click the button below to choose a new password.
                    </p>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#2563eb 0%,#4f46e5 100%);border-radius:10px;box-shadow:0 4px 16px rgba(37,99,235,0.35);">
                          <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;white-space:nowrap;">
                            Reset Password &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Expiry notice -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.18);border-radius:8px;padding:12px 16px;">
                          <p style="margin:0;font-size:13px;color:#fbbf24;line-height:1.5;">
                            ⏱ This link expires in <strong>${expiresInMinutes} minutes</strong>. If it expires, you can request a new one on the login page.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Security notice -->
                    <p style="margin:0 0 16px;font-size:13px;color:#64748b;line-height:1.6;">
                      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged. No action is needed.
                    </p>

                    <!-- URL fallback -->
                    <p style="margin:0;font-size:12px;color:#475569;line-height:1.5;">
                      If the button doesn't work, copy and paste this link:<br/>
                      <a href="${resetUrl}" style="color:#6d96f5;word-break:break-all;text-decoration:none;">${resetUrl}</a>
                    </p>

                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:0 40px;">
                    <div style="height:1px;background:rgba(255,255,255,0.06);"></div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 40px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
                            Sent by <strong style="color:#64748b;">Livery Connect</strong> — Fleet & Dispatch Management<br/>
                            Need help? Contact <a href="mailto:support@liveryconnect.com" style="color:#6d96f5;text-decoration:none;">support@liveryconnect.com</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Bottom caption -->
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="margin:0;font-size:11px;color:#334155;">
                © ${new Date().getFullYear()} Livery Connect · All rights reserved
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Password Change OTP Email ───────────────────────────────────────────────

export function buildPasswordChangeOtpEmailHtml(params: {
  code: string
  userName?: string
}) {
  const { code, userName } = params
  const digits = code.split("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Your verification code</title>
</head>
<body style="margin:0;padding:0;background:#0a0e18;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Your Livery Connect verification code: ${code}. Expires in 5 minutes.</div>
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">&#847;&zwnj;&nbsp;</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0e18;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">

          <!-- Brand -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:10px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:#c9a87c;">Livery Connect</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:rgba(14,19,34,0.98);border:1px solid rgba(201,168,124,0.13);border-radius:16px;overflow:hidden;">
              <div style="height:3px;background:linear-gradient(90deg,rgba(201,168,124,0) 0%,rgba(201,168,124,0.7) 50%,rgba(201,168,124,0) 100%);"></div>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:36px 36px 28px;text-align:center;">

                    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f1f5f9;">Verification Code</h1>
                    <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.6;">
                      ${userName ? `Hi ${userName}, enter` : "Enter"} this code in Livery Connect to confirm your password change.
                    </p>

                    <!-- OTP digits -->
                    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
                      <tr>
                        ${digits.map(d => `
                        <td style="padding:0 4px;">
                          <div style="width:44px;height:56px;background:rgba(255,255,255,0.06);border:1px solid rgba(201,168,124,0.25);border-radius:10px;text-align:center;line-height:56px;font-size:26px;font-weight:700;font-family:monospace;color:#f1f5f9;letter-spacing:0;">${d}</div>
                        </td>`).join("")}
                      </tr>
                    </table>

                    <!-- Expiry -->
                    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px;max-width:340px;width:100%;">
                      <tr>
                        <td style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.18);border-radius:8px;padding:10px 16px;text-align:center;">
                          <p style="margin:0;font-size:13px;color:#fbbf24;">⏱ Expires in <strong>5 minutes</strong></p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                      If you didn't request this, someone may be attempting to access your account. Please secure your account immediately.
                    </p>

                  </td>
                </tr>

                <tr>
                  <td style="padding:0 36px;">
                    <div style="height:1px;background:rgba(255,255,255,0.06);"></div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:16px 36px 24px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#475569;">
                      Livery Connect — Fleet & Dispatch Management<br/>
                      <a href="mailto:support@liveryconnect.com" style="color:#6d96f5;text-decoration:none;">support@liveryconnect.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function buildInvoiceEmailHtml(params: {
  companyName: string
  invoiceNumber: string
  invoiceDate: string
  passengerName: string
  total: string
  message?: string
}) {
  const { companyName, invoiceNumber, invoiceDate, passengerName, total, message } = params

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:540px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#0f172a;padding:24px 28px;">
      <p style="margin:0 0 2px;font-size:18px;font-weight:800;color:#ffffff;">${companyName}</p>
      <p style="margin:0;font-size:12px;color:#94a3b8;">Invoice</p>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Invoice Number</p>
      <p style="margin:0 0 28px;font-size:28px;font-weight:800;color:#0f172a;font-family:monospace;letter-spacing:2px;">${invoiceNumber}</p>

      <p style="margin:0 0 20px;font-size:14px;color:#475569;">Hi ${passengerName},<br/>Please find your invoice attached. Thank you for your business.</p>

      <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
        <div style="background:#f8fafc;padding:12px 16px;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Invoice Details</p>
        </div>
        <div style="padding:16px;">
          <div style="margin-bottom:14px;">
            <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;">Date</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">${invoiceDate}</p>
          </div>
          <div style="border-top:1px solid #e2e8f0;padding-top:14px;">
            <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;">Total Amount Due</p>
            <p style="margin:0;font-size:18px;font-weight:800;color:#0f172a;">${total}</p>
          </div>
        </div>
      </div>

      ${message ? `<div style="background:#f8fafc;padding:16px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#1e293b;line-height:1.5;">${message.replace(/\n/g, '<br/>')}</p>
      </div>` : ''}

      <p style="margin:0;font-size:13px;color:#64748b;">The invoice PDF is attached to this email. If you have any questions, please contact us.</p>
    </div>
    <div style="background:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">Sent via Livery Connect</p>
    </div>
  </div>
</body>
</html>`
}
