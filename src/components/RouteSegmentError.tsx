"use client";

import { Alert, Button, Stack, Text } from "@mantine/core";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

type RouteSegmentErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export const RouteSegmentError = ({ error, reset }: RouteSegmentErrorProps) => {
  const t = useTranslations("common.route");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Stack gap="md" py="lg" align="flex-start" w="100%">
      <Alert color="red" title={t("errorTitle")} variant="light">
        <Text size="sm">{t("errorDescription")}</Text>
      </Alert>
      <Button onClick={() => reset()} variant="light">
        {t("tryAgain")}
      </Button>
    </Stack>
  );
};
