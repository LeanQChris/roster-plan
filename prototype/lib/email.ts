import "server-only";
import nodemailer from "nodemailer";

// Server-only SMTP transport (nodemailer) — used instead of Supabase's
// built-in Auth email so invite/account emails go out even without SMTP
// configured in the Supabase dashboard. Auth links are minted via
// supabase.auth.admin.generateLink() (no email sent by Supabase) and
// delivered through this transport instead.
function getTransport() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT ?? 587),
    secure: Number(process.env.MAIL_PORT) === 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const transport = getTransport();
    await transport.sendMail({
      from: process.env.MAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to send email.",
    };
  }
}

export async function sendInviteEmail(
  to: string,
  inviteLink: string,
  companyName: string,
): Promise<{ ok: boolean; error?: string }> {
  return sendMail({
    to,
    subject: `You've been invited to join ${companyName} on Roster`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="margin-bottom: 8px;">You're invited to ${companyName}</h2>
        <p style="color: #555;">Click below to accept your invite and set a password.</p>
        <p>
          <a href="${inviteLink}"
             style="display: inline-block; margin-top: 12px; padding: 10px 20px; background: #5e6ad2; color: #fff; text-decoration: none; border-radius: 6px;">
            Accept invite
          </a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          If the button doesn't work, copy and paste this link into your browser:<br />
          <a href="${inviteLink}">${inviteLink}</a>
        </p>
      </div>
    `,
  });
}
