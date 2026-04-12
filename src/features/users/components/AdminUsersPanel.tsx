"use client";

import { Select, Table, Text } from "@mantine/core";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { isIssuesQueryError } from "@/features/issues/issues-query-error";
import { APP_ROLE, type AppRole } from "@/lib/auth/types";

import { useAdminUsersList } from "../hooks/useAdminUsersList";
import { useUpdateUserRole } from "../hooks/useUpdateUserRole";

interface AdminUsersPanelProps {
  locale: string;
  isSuperAdmin: boolean;
}

const canEditUserRow = (
  actorIsSuper: boolean,
  targetRole: AppRole,
): boolean => {
  if (actorIsSuper) return true;
  return targetRole === APP_ROLE.user;
};

const AdminUsersPanel = ({
  locale,
  isSuperAdmin,
}: AdminUsersPanelProps) => {
  const t = useTranslations("admin.users");
  const tAdmin = useTranslations("admin");
  const tRoles = useTranslations("admin.roles");
  const { data, isPending, isError, error } = useAdminUsersList(locale);
  const updateRole = useUpdateUserRole(locale);

  const roleSelectData = useMemo(
    () =>
      [
        { value: APP_ROLE.user, label: tRoles("user") },
        { value: APP_ROLE.admin, label: tRoles("admin") },
        ...(isSuperAdmin
          ? [{ value: APP_ROLE.super_admin, label: tRoles("super_admin") }]
          : []),
      ],
    [isSuperAdmin, tRoles],
  );

  if (isPending) {
    return <Text c="dimmed">{t("loading")}</Text>;
  }
  if (isError) {
    const key = isIssuesQueryError(error)
      ? error.errorKey
      : "errors.listUsersFailed";
    return <Text c="red">{tAdmin(key)}</Text>;
  }

  return (
    <Table.ScrollContainer minWidth={520}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("email")}</Table.Th>
            <Table.Th>{t("name")}</Table.Th>
            <Table.Th>{t("role")}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((row) => {
            const editable = canEditUserRow(isSuperAdmin, row.role);
            return (
              <Table.Tr key={row.id}>
                <Table.Td>{row.email}</Table.Td>
                <Table.Td>{row.full_name ?? "—"}</Table.Td>
                <Table.Td>
                  {editable ? (
                    <Select
                      size="xs"
                      data={roleSelectData}
                      value={row.role}
                      onChange={(v) => {
                        if (!v || v === row.role) return;
                        updateRole.mutate({ userId: row.id, role: v });
                      }}
                      disabled={
                        updateRole.isPending &&
                        updateRole.variables?.userId === row.id
                      }
                      aria-label={t("role")}
                    />
                  ) : (
                    <Text size="sm">{tRoles(row.role)}</Text>
                  )}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
};

export default AdminUsersPanel;
