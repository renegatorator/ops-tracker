import "server-only";

import { Resend } from "resend";

import { localizedPath } from "@/i18n/localized-path";
import { env, getResendApiKey, getResendFrom } from "@/lib/env";
import { issueDetailPath } from "@/lib/routes";

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

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
    const url = escapeHtml(issueUrl);

    const html = `
    <p>Your issue was created:</p>
    <p><strong>${title}</strong></p>
    <p><a href="${url}">View issue</a></p>
  `.trim();

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
