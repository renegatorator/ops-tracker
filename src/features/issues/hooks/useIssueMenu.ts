"use client";

import { useTranslations } from "next-intl";

import type { IssueMenuItem, IssueStatusRow, IssueWithStatus } from "../types";

interface UseIssueMenuParams {
  issue: IssueWithStatus;
  /** Statuses already sorted ascending by sort_order. */
  statuses: IssueStatusRow[];
  onTransition: (statusId: string) => void;
  onClose: () => void;
  isAdmin: boolean;
}

export const useIssueMenu = ({
  issue,
  statuses,
  onTransition,
  onClose,
  isAdmin,
}: UseIssueMenuParams): IssueMenuItem[] => {
  const t = useTranslations();

  const currentIndex = statuses.findIndex((s) => s.id === issue.status_id);
  const prevStatus = currentIndex > 0 ? statuses[currentIndex - 1] : null;
  const nextStatus =
    currentIndex !== -1 && currentIndex < statuses.length - 1
      ? statuses[currentIndex + 1]
      : null;

  const items: IssueMenuItem[] = [];

  if (nextStatus) {
    items.push({
      kind: "action",
      label: t("projects.board.moveToNext", { name: nextStatus.name }),
      onClick: () => onTransition(nextStatus.id),
    });
  }

  if (prevStatus) {
    items.push({
      kind: "action",
      label: t("projects.board.moveToPrev", { name: prevStatus.name }),
      onClick: () => onTransition(prevStatus.id),
    });
  }

  if (isAdmin) {
    if (items.length > 0) {
      items.push({ kind: "divider" });
    }
    items.push({
      kind: "action",
      label: t("projects.board.closeIssue"),
      color: "red",
      onClick: onClose,
    });
  }

  return items;
};
