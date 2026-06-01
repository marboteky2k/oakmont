// ── Branded HTML email templates ─────────────────────────────────────────────

const BRAND = 'Oakmont Ridge Capital'
const BRAND_COLOR = '#1E40AF'
const BRAND_LIGHT = '#EFF6FF'

function base(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:${BRAND_COLOR};border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">${BRAND}</p>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Institutional-Grade Investment Platform</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94A3B8;">
              © ${new Date().getFullYear()} ${BRAND}. All rights reserved.<br/>
              This email was sent to you because you have an account with us.<br/>
              <a href="#" style="color:#64748B;">Unsubscribe</a> · <a href="#" style="color:#64748B;">Privacy Policy</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btn(href: string, label: string, color = BRAND_COLOR): string {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#fff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;margin:24px 0;">${label}</a>`
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #E2E8F0;margin:28px 0;" />`
}

function note(text: string): string {
  return `<div style="background:${BRAND_LIGHT};border:1px solid #BFDBFE;border-radius:10px;padding:16px 20px;margin:20px 0;">
    <p style="margin:0;font-size:13px;color:#1E40AF;">${text}</p>
  </div>`
}

function warning(text: string): string {
  return `<div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:10px;padding:16px 20px;margin:20px 0;">
    <p style="margin:0;font-size:13px;color:#92400E;">⚠️ ${text}</p>
  </div>`
}

// ── Individual templates ──────────────────────────────────────────────────────

export function verificationEmail(params: { name: string; link: string }): string {
  return base('Verify Your Email Address', `
    <p style="margin:0 0 4px;font-size:24px;font-weight:800;color:#0F172A;">Verify your email address</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748B;">Hi ${params.name}, welcome to ${BRAND}!</p>

    <p style="font-size:15px;color:#334155;line-height:1.7;">
      Thank you for creating your account. To get started, please verify your email address by clicking the button below.
    </p>

    <div style="text-align:center;">
      ${btn(params.link, 'Verify Email Address')}
    </div>

    ${note('This verification link expires in <strong>24 hours</strong>. If it expires, you can request a new one from the login page.')}

    ${divider()}

    <p style="font-size:13px;color:#94A3B8;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${params.link}" style="color:#3B82F6;word-break:break-all;">${params.link}</a>
    </p>

    <p style="font-size:13px;color:#94A3B8;margin-top:16px;">
      If you didn't create this account, you can safely ignore this email.
    </p>
  `)
}

export function welcomeEmail(params: { name: string; dashboardLink: string }): string {
  return base(`Welcome to ${BRAND}`, `
    <p style="margin:0 0 4px;font-size:24px;font-weight:800;color:#0F172A;">Welcome aboard, ${params.name}! 🎉</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748B;">Your email has been verified successfully.</p>

    <p style="font-size:15px;color:#334155;line-height:1.7;">
      You're now part of an elite community of investors and traders. Here's how to get started:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      ${['Complete your KYC verification to unlock all features', 'Fund your account with USDT, BTC, or ETH', 'Browse our top-performing copy traders'].map((step, i) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #F1F5F9;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:32px;height:32px;background:${BRAND_COLOR};border-radius:50%;color:#fff;font-weight:800;font-size:14px;text-align:center;line-height:32px;flex-shrink:0;">${i + 1}</div>
            <p style="margin:0;font-size:14px;color:#334155;">${step}</p>
          </div>
        </td>
      </tr>`).join('')}
    </table>

    <div style="text-align:center;">
      ${btn(params.dashboardLink, 'Go to Dashboard')}
    </div>

    <p style="font-size:13px;color:#94A3B8;text-align:center;margin-top:20px;">
      Need help? Contact our support team at <a href="mailto:support@oakmontridgecapital.com" style="color:#3B82F6;">support@oakmontridgecapital.com</a>
    </p>
  `)
}

export function withdrawalVerificationEmail(params: {
  name: string; amount: string; currency: string; address: string; link: string; expiresMins: number; code: string
}): string {
  return base('Confirm Withdrawal Request', `
    <p style="margin:0 0 4px;font-size:24px;font-weight:800;color:#0F172A;">Confirm your withdrawal</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748B;">Hi ${params.name}, we received a withdrawal request from your account.</p>

    <!-- Withdrawal details -->
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${[['Amount', `${params.amount} ${params.currency}`], ['Destination Address', params.address]].map(([k, v]) => `
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#64748B;width:38%;">${k}</td>
          <td style="padding:8px 0;font-size:14px;font-weight:600;color:#0F172A;word-break:break-all;">${v}</td>
        </tr>`).join('')}
      </table>
    </div>

    <!-- Verification code — primary method -->
    <div style="background:#F0FDF4;border:2px solid #86EFAC;border-radius:14px;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#166534;text-transform:uppercase;letter-spacing:1px;">Your Verification Code</p>
      <p style="margin:0 0 10px;font-size:40px;font-weight:900;color:#15803D;letter-spacing:10px;font-family:monospace;">${params.code}</p>
      <p style="margin:0;font-size:12px;color:#16A34A;">Enter this code in the withdrawal confirmation screen in your dashboard.</p>
    </div>

    <p style="font-size:14px;color:#334155;line-height:1.7;text-align:center;">
      Or click the button below to confirm automatically:
    </p>

    <div style="text-align:center;">
      ${btn(params.link, 'Confirm Withdrawal', '#059669')}
    </div>

    ${warning(`This code and link expire in <strong>${params.expiresMins} minutes</strong>. Cryptocurrency transactions cannot be reversed once processed.`)}

    ${divider()}

    <p style="font-size:13px;color:#94A3B8;">
      Backup link: <a href="${params.link}" style="color:#3B82F6;word-break:break-all;">${params.link}</a>
    </p>

    <p style="font-size:13px;color:#94A3B8;margin-top:12px;">
      If you did <strong>not</strong> request this withdrawal, contact support immediately at
      <a href="mailto:support@oakmontridgecapital.com" style="color:#3B82F6;">support@oakmontridgecapital.com</a>
    </p>
  `)
}

export function passwordResetEmail(params: { name: string; link: string }): string {
  return base('Reset Your Password', `
    <p style="margin:0 0 4px;font-size:24px;font-weight:800;color:#0F172A;">Reset your password</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748B;">Hi ${params.name}, we received a request to reset your password.</p>

    <p style="font-size:15px;color:#334155;line-height:1.7;">
      Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.
    </p>

    <div style="text-align:center;">
      ${btn(params.link, 'Reset Password', '#DC2626')}
    </div>

    ${warning('If you did not request a password reset, ignore this email. Your password will not be changed.')}

    ${divider()}

    <p style="font-size:13px;color:#94A3B8;">
      Link: <a href="${params.link}" style="color:#3B82F6;word-break:break-all;">${params.link}</a>
    </p>
  `)
}

export function kycApprovedEmail(params: { name: string; dashboardLink: string }): string {
  return base('KYC Verification Approved ✓', `
    <p style="margin:0 0 4px;font-size:24px;font-weight:800;color:#0F172A;">Your KYC has been approved!</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748B;">Hi ${params.name}, your identity has been verified.</p>

    <div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:12px;padding:20px 24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;font-size:32px;">✅</p>
      <p style="margin:8px 0 0;font-size:16px;font-weight:700;color:#166534;">Verification Complete</p>
      <p style="margin:4px 0 0;font-size:14px;color:#15803D;">Your account is now fully verified</p>
    </div>

    <p style="font-size:15px;color:#334155;line-height:1.7;">You now have full access to all platform features:</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      ${['Unlimited deposits & withdrawals', 'Full investment plan access', 'Higher copy trading limits ($10,000+)', 'Referral commission payouts'].map(f => `
      <tr><td style="padding:6px 0;font-size:14px;color:#334155;">✦ &nbsp;${f}</td></tr>`).join('')}
    </table>

    <div style="text-align:center;">
      ${btn(params.dashboardLink, 'Go to Dashboard', '#059669')}
    </div>
  `)
}

export function kycRejectedEmail(params: { name: string; reason: string; kycLink: string }): string {
  return base('Action Required: KYC Verification', `
    <p style="margin:0 0 4px;font-size:24px;font-weight:800;color:#0F172A;">KYC verification requires attention</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748B;">Hi ${params.name}, we were unable to verify your identity.</p>

    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#991B1B;">Rejection reason:</p>
      <p style="margin:0;font-size:14px;color:#B91C1C;">${params.reason}</p>
    </div>

    <p style="font-size:15px;color:#334155;line-height:1.7;">
      Please review the reason above and resubmit your documents with the required corrections.
      Common issues include blurry photos, expired documents, or mismatched personal information.
    </p>

    <div style="text-align:center;">
      ${btn(params.kycLink, 'Resubmit Documents', '#DC2626')}
    </div>

    <p style="font-size:13px;color:#94A3B8;text-align:center;margin-top:16px;">
      Questions? Contact <a href="mailto:support@oakmontridgecapital.com" style="color:#3B82F6;">support@oakmontridgecapital.com</a>
    </p>
  `)
}

export function supportTicketAdminEmail(params: {
  ticketNumber: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  source: string;
  createdAt: string;
}): string {
  const sourceLabel = params.source === 'contact' ? 'Contact Us page' : 'Support Center'
  return base(`New Support Ticket ${params.ticketNumber}`, `
    <p style="margin:0 0 4px;font-size:24px;font-weight:800;color:#0F172A;">New Support Ticket</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748B;">A new ticket has been submitted via the ${sourceLabel}.</p>

    <div style="background:#F8FAFC;border:2px solid #E2E8F0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${[
          ['Ticket #', params.ticketNumber],
          ['Name', params.name],
          ['Email', params.email],
          ['Subject', params.subject || '—'],
          ['Source', sourceLabel],
          ['Submitted', params.createdAt],
        ].map(([k, v]) => `
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#64748B;width:30%;vertical-align:top;">${k}</td>
          <td style="padding:8px 0;font-size:14px;font-weight:600;color:#0F172A;">${v}</td>
        </tr>`).join('')}
      </table>
    </div>

    <div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
      <p style="margin:0;font-size:14px;color:#334155;line-height:1.8;white-space:pre-wrap;">${params.message}</p>
    </div>

    ${note('Reply directly to this email or log into the admin panel to manage this ticket.')}
  `)
}

export function supportTicketUserEmail(params: {
  ticketNumber: string;
  name: string;
  subject: string;
  message: string;
  dashboardLink: string;
}): string {
  return base(`Support Ticket ${params.ticketNumber} Received`, `
    <p style="margin:0 0 4px;font-size:24px;font-weight:800;color:#0F172A;">We've received your message</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748B;">Hi ${params.name}, your support request has been submitted.</p>

    <!-- Ticket badge -->
    <div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:14px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#1E40AF;text-transform:uppercase;letter-spacing:1px;">Your Ticket Number</p>
      <p style="margin:0;font-size:32px;font-weight:900;color:#1E40AF;letter-spacing:4px;font-family:monospace;">${params.ticketNumber}</p>
      <p style="margin:8px 0 0;font-size:12px;color:#3B82F6;">Keep this for reference when following up</p>
    </div>

    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#475569;">${params.subject || 'Support Request'}</p>
      <p style="margin:0;font-size:13px;color:#64748B;line-height:1.7;white-space:pre-wrap;">${params.message.length > 300 ? params.message.slice(0, 300) + '…' : params.message}</p>
    </div>

    <p style="font-size:15px;color:#334155;line-height:1.7;">
      Our support team will review your request and respond within <strong>24 hours</strong>.
      You'll receive a reply directly to this email address.
    </p>

    ${note('If your issue is urgent, you can also email <a href="mailto:support@oakmontridgecapital.com" style="color:#1E40AF;">support@oakmontridgecapital.com</a> directly and reference your ticket number.')}

    <div style="text-align:center;">
      ${btn(params.dashboardLink, 'Go to Dashboard')}
    </div>
  `)
}

export function securityAlertEmail(params: { name: string; ip: string; device: string; time: string; securityLink: string }): string {
  return base('New Login Detected', `
    <p style="margin:0 0 4px;font-size:24px;font-weight:800;color:#0F172A;">New sign-in to your account</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748B;">Hi ${params.name}, we noticed a new login to your account.</p>

    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${[['Time', params.time], ['IP Address', params.ip], ['Device / Browser', params.device]].map(([k, v]) => `
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#64748B;width:40%;">${k}</td>
          <td style="padding:8px 0;font-size:14px;font-weight:600;color:#0F172A;">${v}</td>
        </tr>`).join('')}
      </table>
    </div>

    ${warning('If this was not you, secure your account immediately by changing your password.')}

    <div style="text-align:center;">
      ${btn(params.securityLink, 'Secure My Account', '#DC2626')}
    </div>
  `)
}
