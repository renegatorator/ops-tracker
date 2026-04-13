/**
 * Converts a dot/hyphen-separated action key into an underscore key
 * that matches the translation map (e.g. "issue.status_transition" → "issue_status_transition").
 */
export const auditActionKey = (action: string): string =>
  action.replace(/\./g, "_").replace(/-/g, "_");

/**
 * Returns a Mantine colour token for a given audit action string.
 */
export const auditActionColor = (action: string): string => {
  if (action === "issue.create") return "green";
  if (action === "issue.archive") return "red";
  if (action.includes("assign")) return "blue";
  if (action.includes("status")) return "violet";
  return "gray";
};

/**
 * Returns a truncated JSON string preview of an audit log metadata object.
 */
export const auditMetadataPreview = (
  meta: Record<string, unknown>,
): string => {
  try {
    const s = JSON.stringify(meta);
    return s.length > 200 ? `${s.slice(0, 200)}…` : s;
  } catch {
    return "—";
  }
};
