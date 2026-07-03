/**
 * Resend email helper for Better Auth flows.
 *
 * Used inside `createAuthOptions` for `sendVerificationEmail` and
 * `sendResetPassword`. Falls back to a console warning when `RESEND_API_KEY`
 * is unset so the dev server still boots without email delivery.
 */

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendResendEmail(args: SendArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.warn('[auth] RESEND_API_KEY / RESEND_FROM_EMAIL not set — skipping email send.', args);
    return;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [args.to],
        subject: args.subject,
        html: args.html,
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error('[auth] Resend API error', response.status, body);
    }
  } catch (err) {
    console.error('[auth] Resend API request failed', err);
  }
}

function emailHtml({
  title,
  body,
  cta,
  url,
  footer,
}: {
  title: string;
  body: string;
  cta: string;
  url: string;
  footer: string;
}): string {
  return `<!doctype html>
<html>
  <body style="font-family: -apple-system, system-ui, sans-serif; line-height: 1.5; color: #1a1a1a; padding: 24px;">
    <h1 style="font-size: 20px; margin-bottom: 16px;">${title}</h1>
    <p>${body}</p>
    <p style="margin: 24px 0;">
      <a href="${url}" style="background: #1a1a1a; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
        ${cta}
      </a>
    </p>
    <p style="color: #666; font-size: 14px;">${footer}</p>
  </body>
</html>`;
}

export const verifyEmailHtml = (url: string) =>
  emailHtml({
    title: 'Verify your Khit email',
    body: 'Welcome to Khit. Confirm your email address to finish creating your account.',
    cta: 'Verify email',
    url,
    footer: 'If you did not create an account, you can safely ignore this email.',
  });

export const resetPasswordHtml = (url: string) =>
  emailHtml({
    title: 'Reset your Khit password',
    body: 'Click the link below to set a new password for your account.',
    cta: 'Reset password',
    url,
    footer: 'If you did not request a password reset, you can safely ignore this email.',
  });
