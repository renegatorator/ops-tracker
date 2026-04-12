import "server-only";

import { Resend } from "resend";

import { localizedPath } from "@/i18n/localized-path";
import { env, getResendApiKey, getResendFrom } from "@/lib/env";
import { issueDetailPath } from "@/lib/routes";

import { buildEmailHtml, escapeHtml } from "./email-template";

/**
 * Confirms to the reporter that their issue was created (link to detail).
 * Skips when `RESEND_API_KEY` or recipient email is missing. Never throws.
 */
export const sendIssueCreatedReporterEmailIfConfigured = async (input: {
  locale: string;
  issueId: string;
  title: string;
  toEmail: string | undefined;
}): Promise<void> => {
  const apiKey = getResendApiKey();
  const to = input.toEmail?.trim();
  if (!apiKey || !to) return;

  try {
    const siteUrl = env("NEXT_PUBLIC_SITE_URL").replace(/\/$/, "");
    const issueUrl = `${siteUrl}${localizedPath(input.locale, issueDetailPath(input.issueId))}`;
    const title = escapeHtml(input.title);

    const bodyHtml = `
      <p style="margin:0 0 16px;">Your issue has been created successfully.</p>
      <p style="margin:0 0 24px;padding:16px;background:#f8f9fa;border-left:4px solid #6741d9;border-radius:4px;font-weight:600;">
        ${title}
      </p>
      <p style="margin:0 0 24px;color:#495057;">
        You can track progress, update the description, and manage assignees from the issue page.
      </p>
    `;

    const html = buildEmailHtml({
      bodyHtml,
      ctaLabel: "View Issue",
      ctaUrl: issueUrl,
    });

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: getResendFrom(),
      to,
      subject: `Issue created: ${input.title}`,
      html,
    });
    if (error) {
      console.error("[email] Resend API error (issue created)", error.message);
    }
  } catch (e) {
    console.error("[email] issue created send failed", e);
  }
};
