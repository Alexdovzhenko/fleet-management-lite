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
