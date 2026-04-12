import "server-only";

export const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

interface EmailTemplateOptions {
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
}

/**
 * Builds a branded, email-client-safe HTML layout.
 * Uses a text wordmark in the header (SVG/images are not supported by most email clients).
 */
export const buildEmailHtml = ({
  bodyHtml,
  ctaLabel,
  ctaUrl,
}: EmailTemplateOptions): string => {
  const safeCtaUrl = escapeHtml(ctaUrl);
  const safeCtaLabel = escapeHtml(ctaLabel);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ops Tracker</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:#ffffff;padding:28px 32px 20px;border-bottom:1px solid #e9ecef;">
              <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:20px;line-height:1;display:inline-block;"><span style="font-weight:800;color:#1C2A3A;letter-spacing:-0.3px;">Ops</span><span style="font-weight:400;color:#475569;letter-spacing:-0.2px;">Tracker</span></span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;color:#212529;font-size:15px;line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:0 40px 32px;">
              <a href="${safeCtaUrl}"
                 style="display:inline-block;background:#6741d9;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px;">
                ${safeCtaLabel}
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa;padding:20px 40px;border-top:1px solid #e9ecef;text-align:center;">
              <p style="margin:0;font-size:12px;color:#868e96;">
                &copy; ${year} Ops Tracker &mdash; You received this because you are a member of this workspace.
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#adb5bd;">
                If you did not expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
