import { useTranslations } from "next-intl";

import { auditActionKey } from "../auditUtils";

interface UseAuditTranslationsResult {
  translateAction: (action: string) => string;
  translateEntityType: (entityType: string) => string;
}

/**
 * Returns helpers that resolve audit log action and entity-type strings to
 * their translated labels, falling back to the raw value when no translation
 * is found.
 */
export const useAuditTranslations = (): UseAuditTranslationsResult => {
  const t = useTranslations("admin.audit");

  const translateAction = (action: string): string => {
    const key = auditActionKey(action);
    try {
      return t(`actions.${key}` as Parameters<typeof t>[0]);
    } catch {
      return action;
    }
  };

  const translateEntityType = (entityType: string): string => {
    try {
      return t(`filters.entity.${entityType}` as Parameters<typeof t>[0]);
    } catch {
      return entityType;
    }
  };

  return { translateAction, translateEntityType };
};
