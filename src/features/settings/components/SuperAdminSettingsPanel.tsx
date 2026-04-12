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

const translateErrorKey = (
  key: string,
  tAdmin: (k: string) => string,
  tIssues: (k: string) => string,
) => (key.startsWith("settings.") ? tAdmin(key) : tIssues(key));

const SuperAdminSettingsPanel = ({
  locale,
  demoResetEnabled,
  demoResetEnvRaw,
  experimentalUi,
  publicSiteUrl,
  nodeEnv,
}: SuperAdminSettingsPanelProps) => {
  const t = useTranslations("admin.settings");
  const tAdmin = useTranslations("admin");
  const tIssues = useTranslations("issues");
  const resetMut = useResetDemoData(locale);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Stack gap="xl" w="100%">
      <Stack gap="sm">
        <Title order={3}>{t("flags.title")}</Title>
        <Table striped highlightOnHover withTableBorder>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td>{t("flags.demoReset")}</Table.Td>
              <Table.Td>
                {demoResetEnabled ? t("flags.on") : t("flags.off")}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>{t("flags.demoResetEnv")}</Table.Td>
              <Table.Td>
                <Text size="sm" ff="monospace">
                  {demoResetEnvRaw ?? t("flags.unset")}
                </Text>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>{t("flags.experimentalUi")}</Table.Td>
              <Table.Td>
                {experimentalUi ? t("flags.on") : t("flags.off")}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>{t("flags.publicSiteUrl")}</Table.Td>
              <Table.Td>
                <Text size="sm" ff="monospace">
                  {publicSiteUrl}
                </Text>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>{t("flags.nodeEnv")}</Table.Td>
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
        <Title order={3}>{t("demoReset.title")}</Title>
        <Text size="sm" c="dimmed">
          {t("demoReset.description")}
        </Text>
        <div>
          <Button
            color="red"
            variant="light"
            disabled={!demoResetEnabled}
            onClick={() => {
              resetMut.reset();
              setConfirmOpen(true);
            }}
          >
            {t("demoReset.button")}
          </Button>
        </div>
        {resetMut.isSuccess ? (
          <Text size="sm" c="green">
            {t("demoReset.success", { count: resetMut.data.issuesDeleted })}
          </Text>
        ) : null}
        {resetMut.isError && isIssuesQueryError(resetMut.error) ? (
          <Text size="sm" c="red">
            {translateErrorKey(resetMut.error.errorKey, tAdmin, tIssues)}
          </Text>
        ) : null}
      </Stack>

      <Modal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t("demoReset.confirmTitle")}
      >
        <Stack gap="md">
          <Text size="sm">{t("demoReset.confirmBody")}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmOpen(false)}>
              {t("demoReset.cancel")}
            </Button>
            <Button
              color="red"
              loading={resetMut.isPending}
              onClick={() => {
                resetMut.mutate(undefined, {
                  onSettled: () => setConfirmOpen(false),
                });
              }}
            >
              {t("demoReset.confirmButton")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default SuperAdminSettingsPanel;
