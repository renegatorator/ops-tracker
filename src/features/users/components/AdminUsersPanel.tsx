"use client";

import { Select, Table, Text } from "@mantine/core";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { isIssuesQueryError } from "@/features/issues/issues-query-error";
import { type AppRole, AppRoles } from "@/lib/auth/types";

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
  return targetRole === AppRoles.USER;
};

const AdminUsersPanel = ({
  locale,
  isSuperAdmin,
}: AdminUsersPanelProps) => {
  const t = useTranslations();
  const { data, isPending, isError, error } = useAdminUsersList(locale);
  const {
    mutate: updateUserRole,
    isPending: updateRolePending,
    variables: updateRoleVariables,
  } = useUpdateUserRole(locale);

  const roleSelectData = useMemo(
    () =>
      [
        { value: AppRoles.USER, label: t("admin.roles.user") },
        { value: AppRoles.ADMIN, label: t("admin.roles.admin") },
        ...(isSuperAdmin
          ? [
              {
                value: AppRoles.SUPER_ADMIN,
                label: t("admin.roles.super_admin"),
              },
            ]
          : []),
      ],
    [isSuperAdmin, t],
  );

  if (isPending) {
    return (
      <TableSkeleton
        columnWidths={["40%", "35%", "25%"]}
        ariaLabel={t("admin.users.loading")}
      />
    );
  }
  if (isError) {
    const key = isIssuesQueryError(error)
      ? error.errorKey
      : "errors.listUsersFailed";
    return <Text c="red">{t(`admin.${key}` as Parameters<typeof t>[0])}</Text>;
  }

  return (
    <Table.ScrollContainer minWidth={520}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("admin.users.email")}</Table.Th>
            <Table.Th>{t("admin.users.name")}</Table.Th>
            <Table.Th>{t("admin.users.role")}</Table.Th>
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
                        updateUserRole({ userId: row.id, role: v });
                      }}
                      disabled={
                        updateRolePending &&
                        updateRoleVariables?.userId === row.id
                      }
                      aria-label={t("admin.users.role")}
                    />
                  ) : (
                    <Text size="sm">
                      {t(`admin.roles.${row.role}` as Parameters<typeof t>[0])}
                    </Text>
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
