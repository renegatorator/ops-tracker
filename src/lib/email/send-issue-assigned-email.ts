import "server-only";

import { Resend } from "resend";

import { localizedPath } from "@/i18n/localized-path";
import { env, getResendApiKey, getResendFrom } from "@/lib/env";
import { issueDetailPath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

import { buildEmailHtml, escapeHtml } from "./email-template";

/**
 * Sends a single transactional email when an issue is assigned to someone.
 * When `RESEND_API_KEY` is unset, returns immediately. Never throws to callers.
 */
export const sendIssueAssignedEmailIfConfigured = async (input: {
  locale: string;
  issueId: string;
  assigneeId: string;
}): Promise<void> => {
  const apiKey = getResendApiKey();
  if (!apiKey) return;

  try {
    const supabase = await createClient();
    const [
      { data: issueRow, error: issueErr },
      { data: profile, error: profileErr },
    ] = await Promise.all([
      supabase
        .from("issues")
        .select("title")
        .eq("id", input.issueId)
        .maybeSingle(),
      supabase
        .from("user_profiles")
        .select("email, full_name")
        .eq("id", input.assigneeId)
        .maybeSingle(),
    ]);

    if (issueErr || profileErr || !issueRow?.title || !profile?.email?.trim()) {
      return;
    }

    const siteUrl = env("NEXT_PUBLIC_SITE_URL").replace(/\/$/, "");
    const issueUrl = `${siteUrl}${localizedPath(input.locale, issueDetailPath(input.issueId))}`;
    const greeting = profile.full_name?.trim()
      ? escapeHtml(profile.full_name.trim())
      : "there";
    const title = escapeHtml(issueRow.title);

    const bodyHtml = `
      <p style="margin:0 0 16px;">Hi ${greeting},</p>
      <p style="margin:0 0 16px;">You have been <strong>assigned</strong> to the following issue:</p>
      <p style="margin:0 0 24px;padding:16px;background:#f8f9fa;border-left:4px solid #6741d9;border-radius:4px;font-weight:600;">
        ${title}
      </p>
      <p style="margin:0 0 24px;color:#495057;">
        You can view the full details, update the status, and leave comments from the issue page.
      </p>
    `;

    const html = buildEmailHtml({
      bodyHtml,
      ctaLabel: "Open Issue",
      ctaUrl: issueUrl,
    });

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: getResendFrom(),
      to: profile.email.trim(),
      subject: `Assigned to you: ${issueRow.title}`,
      html,
    });
    if (error) {
      console.error("[email] Resend API error", error.message);
    }
  } catch (e) {
    console.error("[email] issue assigned send failed", e);
  }
};
