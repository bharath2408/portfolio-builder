import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendNotificationEmail(
  to: string,
  submitterName: string,
  submitterEmail: string,
  fields: Record<string, string>,
  portfolioTitle: string,
) {
  const r = getResend();
  if (!r) return;

  const fieldRows = Object.entries(fields)
    .map(
      ([key, value]) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;font-size:13px;white-space:nowrap">${key}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#1a1a1a;font-size:13px">${value}</td></tr>`,
    )
    .join("");

  try {
    await r.emails.send({
      from:
        process.env.NOTIFICATION_FROM_EMAIL ??
        "Foliocraft <noreply@resend.dev>",
      to,
      subject: `New form submission from ${submitterName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1a1a1a;font-size:18px;margin-bottom:4px">New Form Submission</h2>
          <p style="color:#666;font-size:13px;margin-top:0">From your portfolio: ${portfolioTitle}</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;font-size:13px">Name</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#1a1a1a;font-size:13px;font-weight:600">${submitterName}</td></tr>
            <tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;font-size:13px">Email</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#1a1a1a;font-size:13px">${submitterEmail}</td></tr>
            ${fieldRows}
          </table>
          <p style="color:#999;font-size:11px;margin-top:24px">Sent via Foliocraft</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send notification email:", err);
  }
}

export async function sendAutoResponse(
  to: string,
  subject: string,
  body: string,
  variables: Record<string, string>,
) {
  const r = getResend();
  if (!r) return;

  // Replace {{variable}} placeholders
  let processedBody = body;
  for (const [key, value] of Object.entries(variables)) {
    processedBody = processedBody.replace(
      new RegExp(`\\{\\{${key}\\}\\}`, "g"),
      value,
    );
  }

  try {
    await r.emails.send({
      from:
        process.env.NOTIFICATION_FROM_EMAIL ??
        "Foliocraft <noreply@resend.dev>",
      to,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <div style="white-space:pre-wrap;color:#1a1a1a;font-size:14px;line-height:1.7">${processedBody}</div>
          <p style="color:#999;font-size:11px;margin-top:24px">Sent via Foliocraft</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send auto-response:", err);
  }
}
