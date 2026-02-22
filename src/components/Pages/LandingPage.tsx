"use client";

import { Button, Container, Group, Stack } from "@mantine/core";
import { IconCircleCheck } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import Typography from "@/components/Typography/Typography";

import classes from "./LandingPage.module.scss";

export default function LandingPage() {
  const t = useTranslations("landing");

  return (
    <Container size="md" className={classes.container}>
      <Stack
        gap="xl"
        align="center"
        justify="center"
        className={classes.content}
      >
        <div className={classes.iconWrapper}>
          <IconCircleCheck size={80} stroke={1.5} />
        </div>

        <div className={classes.textWrapper}>
          <Typography type="heading-01" className={classes.title}>
            {t("title")}
          </Typography>
          <Typography type="body-01" className={classes.description}>
            {t("description")}
          </Typography>
        </div>

        <Group justify="center" mt="xl">
          <Button size="lg" variant="filled">
            {t("loginButton")}
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
