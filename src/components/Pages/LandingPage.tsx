import {
  Badge,
  Button,
  Container,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconBrandTrello,
  IconBug,
  IconChartBar,
  IconLayoutKanban,
  IconShieldCheck,
  IconUsers,
} from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";

import Typography from "@/components/Typography/Typography";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

import classes from "./LandingPage.module.scss";

const features = [
  {
    icon: IconLayoutKanban,
    titleKey: "features.kanban.title" as const,
    descKey: "features.kanban.description" as const,
    color: "violet",
  },
  {
    icon: IconBug,
    titleKey: "features.tracking.title" as const,
    descKey: "features.tracking.description" as const,
    color: "blue",
  },
  {
    icon: IconUsers,
    titleKey: "features.team.title" as const,
    descKey: "features.team.description" as const,
    color: "teal",
  },
  {
    icon: IconShieldCheck,
    titleKey: "features.audit.title" as const,
    descKey: "features.audit.description" as const,
    color: "orange",
  },
  {
    icon: IconChartBar,
    titleKey: "features.dashboard.title" as const,
    descKey: "features.dashboard.description" as const,
    color: "pink",
  },
  {
    icon: IconBrandTrello,
    titleKey: "features.projects.title" as const,
    descKey: "features.projects.description" as const,
    color: "cyan",
  },
];

const LandingPage = async () => {
  const t = await getTranslations("landing");

  return (
    <Container size="lg">
      {/* Hero */}
      <Stack
        gap="xl"
        align="center"
        justify="center"
        className={classes.hero}
      >
        <div className={classes.logoWrapper}>
          <img
            src="/logo-light.svg"
            alt="Ops Tracker"
            height={72}
            className="ops-logo-light"
            style={{ display: "none" }}
          />
          <img
            src="/logo-dark.svg"
            alt=""
            aria-hidden="true"
            height={72}
            className="ops-logo-dark"
            style={{ display: "none" }}
          />
        </div>

        <Badge variant="light" color="violet" size="lg" radius="sm">
          {t("badge")}
        </Badge>

        <Text
          size="lg"
          c="dimmed"
          maw={560}
          style={{ textAlign: "center", lineHeight: 1.6 }}
        >
          {t("description")}
        </Text>

        <Link href={routes.login}>
          <Button component="span" size="xl" variant="filled" px="xl">
            {t("loginButton")}
          </Button>
        </Link>
      </Stack>

      <Divider my="xl" />

      {/* Feature grid */}
      <Stack gap="xl" pb="xl">
        <Stack gap="xs" align="center" style={{ textAlign: "center" }}>
          <Typography type="heading-02">{t("featuresHeading")}</Typography>
          <Text c="dimmed" maw={500}>
            {t("featuresSubheading")}
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {features.map((f) => (
            <div key={f.titleKey} className={classes.featureCard}>
              <ThemeIcon
                size={48}
                radius="md"
                variant="light"
                color={f.color}
                mb="md"
              >
                <f.icon size={24} />
              </ThemeIcon>
              <Text fw={700} mb={4}>
                {t(f.titleKey)}
              </Text>
              <Text size="sm" c="dimmed">
                {t(f.descKey)}
              </Text>
            </div>
          ))}
        </SimpleGrid>
      </Stack>

      <Divider my="xl" />

      {/* Request a Demo */}
      <Stack gap="lg" align="center" pb="xl" style={{ textAlign: "center" }}>
        <Typography type="heading-02">{t("demoSectionHeading")}</Typography>
        <Text c="dimmed" maw={480}>
          {t("demoSectionSubheading")}
        </Text>
        <Paper
          withBorder
          p="xl"
          radius="md"
          w="100%"
          maw={480}
          className={classes.demoCard}
        >
          <Stack gap="md" align="center">
            <Group justify="center" gap="sm" wrap="wrap">
              <Tooltip label={t("demoComingSoon")} position="top" withArrow>
                <Button size="lg" variant="filled" disabled>
                  {t("demoUserButton")}
                </Button>
              </Tooltip>
              <Tooltip label={t("demoComingSoon")} position="top" withArrow>
                <Button size="lg" variant="light" disabled>
                  {t("demoAdminButton")}
                </Button>
              </Tooltip>
            </Group>
            <Text size="xs" c="dimmed">
              {t("demoDisclaimer")}
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};

export default LandingPage;
