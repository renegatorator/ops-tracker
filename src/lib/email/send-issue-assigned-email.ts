import "server-only";

import { Resend } from "resend";

import { localizedPath } from "@/i18n/localized-path";
import { env, getResendApiKey, getResendFrom } from "@/lib/env";
import { issueDetailPath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const buildAssignmentEmailHtml = (input: {
  issueTitle: string;
  issueUrl: string;
  assigneeName: string | null;
}): string => {
  const title = escapeHtml(input.issueTitle);
  const url = escapeHtml(input.issueUrl);
  const greeting = input.assigneeName
    ? escapeHtml(input.assigneeName)
    : "there";
  return `
    <p>Hi ${greeting},</p>
    <p>You have been <strong>assigned</strong> to the following issue:</p>
    <p><strong>${title}</strong></p>
    <p><a href="${url}">Open issue in Ops Tracker</a></p>
    <p style="color:#666;font-size:12px">This message was sent because an administrator assigned you. If you did not expect it, you can ignore this email.</p>
  `.trim();
};

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
    const [{ data: issueRow, error: issueErr }, { data: profile, error: profileErr }] =
      await Promise.all([
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

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: getResendFrom(),
      to: profile.email.trim(),
      subject: `Assigned: ${issueRow.title}`,
      html: buildAssignmentEmailHtml({
        issueTitle: issueRow.title,
        issueUrl,
        assigneeName: profile.full_name?.trim() ?? null,
      }),
    });
    if (error) {
      console.error("[email] Resend API error", error.message);
    }
  } catch (e) {
    console.error("[email] issue assigned send failed", e);
  }
};
