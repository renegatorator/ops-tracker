import { Button, Container, Group, Stack } from "@mantine/core";
import { IconCircleCheck } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";

import Typography from "@/components/Typography/Typography";
import { Link } from "@/i18n/navigation";

import classes from "./LandingPage.module.scss";

export default async function LandingPage() {
  const t = await getTranslations("landing");

  return (
    <Container size="md">
      <Stack
        gap="xl"
        align="center"
        justify="center"
        className={classes.content}
      >
        <div className={classes.iconWrapper}>
          <IconCircleCheck size={80} stroke={1.5} />
        </div>

        <Stack maw={600}>
          <Typography type="heading-01" className={classes.title}>
            {t("title")}
          </Typography>
          <Typography type="body-01">{t("description")}</Typography>
        </Stack>

        <Group justify="center">
          <Link href="/login">
            <Button component="span" size="lg" variant="filled">
              {t("loginButton")}
            </Button>
          </Link>
        </Group>
      </Stack>
    </Container>
  );
}
