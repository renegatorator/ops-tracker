"use client";

import {
  Button,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { isIssuesQueryError } from "@/features/issues/issues-query-error";

import { useResetDemoData } from "../hooks/useResetDemoData";

interface SuperAdminSettingsPanelProps {
  locale: string;
  demoResetEnabled: boolean;
  demoResetEnvRaw: string | undefined;
  experimentalUi: boolean;
  publicSiteUrl: string;
  nodeEnv: string;
}

const SuperAdminSettingsPanel = ({
  locale,
  demoResetEnabled,
  demoResetEnvRaw,
  experimentalUi,
  publicSiteUrl,
  nodeEnv,
}: SuperAdminSettingsPanelProps) => {
  const t = useTranslations();
  const {
    mutate: resetDemoData,
    isPending: resetPending,
    isSuccess: resetSucceeded,
    isError: resetFailed,
    data: resetData,
    error: resetError,
    reset: clearResetState,
  } = useResetDemoData(locale);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const translateErrorKey = (key: string): string =>
    key.startsWith("settings.")
      ? t(`admin.${key}` as Parameters<typeof t>[0])
      : t(`issues.${key}` as Parameters<typeof t>[0]);

  return (
    <Stack gap="xl" w="100%">
      <Stack gap="sm">
        <Title order={3}>{t("admin.settings.flags.title")}</Title>
        <Table striped highlightOnHover withTableBorder>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td>{t("admin.settings.flags.demoReset")}</Table.Td>
              <Table.Td>
                {demoResetEnabled
                  ? t("admin.settings.flags.on")
                  : t("admin.settings.flags.off")}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>{t("admin.settings.flags.demoResetEnv")}</Table.Td>
              <Table.Td>
                <Text size="sm" ff="monospace">
                  {demoResetEnvRaw ?? t("admin.settings.flags.unset")}
                </Text>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>{t("admin.settings.flags.experimentalUi")}</Table.Td>
              <Table.Td>
                {experimentalUi
                  ? t("admin.settings.flags.on")
                  : t("admin.settings.flags.off")}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>{t("admin.settings.flags.publicSiteUrl")}</Table.Td>
              <Table.Td>
                <Text size="sm" ff="monospace">
                  {publicSiteUrl}
                </Text>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>{t("admin.settings.flags.nodeEnv")}</Table.Td>
              <Table.Td>
                <Text size="sm" ff="monospace">
                  {nodeEnv}
                </Text>
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Stack>

      <Stack gap="sm">
        <Title order={3}>{t("admin.settings.demoReset.title")}</Title>
        <Text size="sm" c="dimmed">
          {t("admin.settings.demoReset.description")}
        </Text>
        <div>
          <Button
            color="red"
            variant="light"
            disabled={!demoResetEnabled}
            onClick={() => {
              clearResetState();
              setConfirmOpen(true);
            }}
          >
            {t("admin.settings.demoReset.button")}
          </Button>
        </div>
        {resetSucceeded ? (
          <Text size="sm" c="green">
            {t("admin.settings.demoReset.success", {
              count: resetData.issuesDeleted,
            })}
          </Text>
        ) : null}
        {resetFailed && isIssuesQueryError(resetError) ? (
          <Text size="sm" c="red">
            {translateErrorKey(resetError.errorKey)}
          </Text>
        ) : null}
      </Stack>

      <Modal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t("admin.settings.demoReset.confirmTitle")}
      >
        <Stack gap="md">
          <Text size="sm">{t("admin.settings.demoReset.confirmBody")}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmOpen(false)}>
              {t("admin.settings.demoReset.cancel")}
            </Button>
            <Button
              color="red"
              loading={resetPending}
              onClick={() => {
                resetDemoData(undefined, {
                  onSettled: () => setConfirmOpen(false),
                });
              }}
            >
              {t("admin.settings.demoReset.confirmButton")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default SuperAdminSettingsPanel;
