"use client";

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Anchor, Button, Group, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { transitionIssueStatus } from "@/features/issues/actions";
import CreateIssueModal from "@/features/issues/components/CreateIssueModal";
import { useIssuesList } from "@/features/issues/hooks/useIssuesList";
import { useIssueStatuses } from "@/features/issues/hooks/useIssueStatuses";
import {
  isIssuesQueryError,
  IssuesQueryError,
} from "@/features/issues/issues-query-error";
import { issueQueryKeys } from "@/features/issues/keys";
import type { IssueWithStatus } from "@/features/issues/types";
import { Link } from "@/i18n/navigation";
import { projectIssueDetailPath } from "@/lib/routes";

import { projectQueryKeys } from "../keys";

interface ProjectBoardPageClientProps {
  locale: string;
  projectId: string;
  projectKey: string;
  isAdmin?: boolean;
}

const IssueCard = ({
  issue,
  projectKey,
}: {
  issue: IssueWithStatus;
  projectKey: string;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: issue.id });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 10 : undefined,
      }
    : undefined;

  const href = projectIssueDetailPath(projectKey, issue.issue_number);

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div
        style={{
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid var(--mantine-color-default-border)",
          background: "var(--mantine-color-body)",
          marginBottom: 8,
          cursor: "grab",
        }}
      >
        <Anchor
          component={Link}
          href={href}
          size="xs"
          ff="monospace"
          onClick={(e) => e.stopPropagation()}
          data-testid="kanban-issue-link"
        >
          {issue.issue_key}
        </Anchor>
        <Text size="sm" fw={600} mt={4}>
          {issue.title}
        </Text>
      </div>
    </div>
  );
};

const StatusColumn = ({
  statusId,
  title,
  children,
}: {
  statusId: string;
  title: string;
  children: React.ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: statusId });
  return (
    <div
      ref={setNodeRef}
      style={{
        minWidth: 260,
        flex: "1 1 260px",
        padding: 8,
        borderRadius: 8,
        border: "1px solid var(--mantine-color-default-border)",
        background: isOver
          ? "var(--mantine-color-blue-light)"
          : "var(--ops-board-column-bg)",
        minHeight: 320,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
};

const ProjectBoardPageClient = ({
  locale,
  projectId,
  projectKey,
  isAdmin = false,
}: ProjectBoardPageClientProps) => {
  const t = useTranslations("projects.board");
  const tIssues = useTranslations("issues");
  const queryClient = useQueryClient();
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const listParams = useMemo(
    () =>
      ({
        mode: "offset" as const,
        offset: 0,
        limit: 100,
        projectId,
      }),
    [projectId],
  );

  const { data, isPending, isError, error } = useIssuesList(locale, listParams);
  const { data: statuses = [] } = useIssueStatuses(locale);

  const issuesByStatus = useMemo(() => {
    const map = new Map<string, IssueWithStatus[]>();
    for (const s of statuses) {
      map.set(s.id, []);
    }
    for (const issue of data?.items ?? []) {
      const list = map.get(issue.status_id);
      if (list) list.push(issue);
    }
    return map;
  }, [data?.items, statuses]);

  const transition = useMutation({
    mutationFn: async (input: { issueId: string; statusId: string }) => {
      const result = await transitionIssueStatus(locale, input);
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: issueQueryKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
    onError: (err) => {
      const key = isIssuesQueryError(err)
        ? err.errorKey
        : "errors.transitionFailed";
      notifications.show({
        title: t("moveFailedTitle"),
        message: tIssues(key),
        color: "red",
      });
    },
  });

  const onDragEnd = (event: DragEndEvent) => {
    const overId = event.over?.id;
    const activeId = String(event.active.id);
    if (!overId || typeof overId !== "string") return;
    const issue = data?.items.find((i) => i.id === activeId);
    if (!issue || issue.status_id === overId) return;
    transition.mutate({ issueId: activeId, statusId: overId });
  };

  if (isPending) {
    return <div style={{ opacity: 0.7 }}>{t("loading")}</div>;
  }
  if (isError) {
    return (
      <div style={{ color: "var(--mantine-color-red-text)" }}>
        {isIssuesQueryError(error)
          ? tIssues(error.errorKey)
          : t("loadFailed")}
      </div>
    );
  }

  return (
    <>
      {isAdmin && (
        <Group justify="flex-end" mb="sm">
          <Button onClick={openModal} size="sm">
            {t("newIssue")}
          </Button>
        </Group>
      )}

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          {statuses.map((s) => (
            <StatusColumn key={s.id} statusId={s.id} title={s.name}>
              {(issuesByStatus.get(s.id) ?? []).map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  projectKey={projectKey}
                />
              ))}
            </StatusColumn>
          ))}
        </div>
      </DndContext>

      {isAdmin && (
        <CreateIssueModal
          locale={locale}
          projectId={projectId}
          projectKey={projectKey}
          opened={modalOpened}
          onClose={closeModal}
        />
      )}
    </>
  );
};

export default ProjectBoardPageClient;
