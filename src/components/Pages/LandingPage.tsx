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
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import Typography from "@/components/Typography/Typography";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

import classes from "./LandingPage.module.scss";

const features = [
  {
    icon: IconLayoutKanban,
    titleKey: "landing.features.kanban.title" as const,
    descKey: "landing.features.kanban.description" as const,
    color: "violet",
  },
  {
    icon: IconBug,
    titleKey: "landing.features.tracking.title" as const,
    descKey: "landing.features.tracking.description" as const,
    color: "blue",
  },
  {
    icon: IconUsers,
    titleKey: "landing.features.team.title" as const,
    descKey: "landing.features.team.description" as const,
    color: "teal",
  },
  {
    icon: IconShieldCheck,
    titleKey: "landing.features.audit.title" as const,
    descKey: "landing.features.audit.description" as const,
    color: "orange",
  },
  {
    icon: IconChartBar,
    titleKey: "landing.features.dashboard.title" as const,
    descKey: "landing.features.dashboard.description" as const,
    color: "pink",
  },
  {
    icon: IconBrandTrello,
    titleKey: "landing.features.projects.title" as const,
    descKey: "landing.features.projects.description" as const,
    color: "cyan",
  },
];

const LandingPage = async () => {
  const t = await getTranslations();

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
          <Image
            src="/logo-light.svg"
            alt="Ops Tracker"
            width={266}
            height={72}
            className="ops-logo-light"
            style={{ display: "none" }}
            unoptimized
          />
          <Image
            src="/logo-dark.svg"
            alt=""
            aria-hidden="true"
            width={266}
            height={72}
            className="ops-logo-dark"
            style={{ display: "none" }}
            unoptimized
          />
        </div>

        <Badge variant="light" color="violet" size="lg" radius="sm">
          {t("landing.badge")}
        </Badge>

        <Text
          size="lg"
          c="dimmed"
          maw={560}
          style={{ textAlign: "center", lineHeight: 1.6 }}
        >
          {t("landing.description")}
        </Text>

        <Link href={routes.login}>
          <Button component="span" size="xl" variant="filled" px="xl">
            {t("landing.loginButton")}
          </Button>
        </Link>
      </Stack>

      <Divider my="xl" />

      {/* Feature grid */}
      <Stack gap="xl" pb="xl">
        <Stack gap="xs" align="center" style={{ textAlign: "center" }}>
          <Typography type="heading-02">
            {t("landing.featuresHeading")}
          </Typography>
          <Text c="dimmed" maw={500}>
            {t("landing.featuresSubheading")}
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
        <Typography type="heading-02">
          {t("landing.demoSectionHeading")}
        </Typography>
        <Text c="dimmed" maw={480}>
          {t("landing.demoSectionSubheading")}
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
              <Tooltip
                label={t("landing.demoComingSoon")}
                position="top"
                withArrow
              >
                <Button size="lg" variant="filled" disabled>
                  {t("landing.demoUserButton")}
                </Button>
              </Tooltip>
              <Tooltip
                label={t("landing.demoComingSoon")}
                position="top"
                withArrow
              >
                <Button size="lg" variant="light" disabled>
                  {t("landing.demoAdminButton")}
                </Button>
              </Tooltip>
            </Group>
            <Text size="xs" c="dimmed">
              {t("landing.demoDisclaimer")}
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};

export default LandingPage;
