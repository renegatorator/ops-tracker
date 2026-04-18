"use client";

import { Alert, Button, Stack, Text } from "@mantine/core";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

type RouteSegmentErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const RouteSegmentError = ({ error, reset }: RouteSegmentErrorProps) => {
  const t = useTranslations();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Stack gap="md" py="lg" align="flex-start" w="100%">
      <Alert color="red" title={t("common.route.errorTitle")} variant="light">
        <Text size="sm">{t("common.route.errorDescription")}</Text>
      </Alert>
      <Button onClick={() => reset()} variant="light">
        {t("common.route.tryAgain")}
      </Button>
    </Stack>
  );
};

export default RouteSegmentError;
