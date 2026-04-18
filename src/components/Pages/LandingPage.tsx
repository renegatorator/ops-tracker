import {
  Badge,
  Box,
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
import { getLocale, getTranslations } from "next-intl/server";

import Typography from "@/components/Typography/Typography";

import classes from "./LandingPage.module.scss";

const PORTFOLIO_BASE_URL = "https://renekrajnc.com";

const buildPortfolioProjectsUrl = (locale: string) => {
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${PORTFOLIO_BASE_URL}${prefix}/projects`;
};

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
  const locale = await getLocale();
  const learnMoreHref = buildPortfolioProjectsUrl(locale);

  return (
    <Container size="lg">
      {/* Hero */}
      <Box className={classes.heroWrapper}>
        <div className={classes.heroGlow} aria-hidden="true" />
        <Stack gap="lg" align="center" className={classes.hero}>
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

          <Badge
            variant="filled"
            color="violet"
            size="md"
            radius="sm"
            className={classes.heroBadge}
          >
            {t("landing.badge")}
          </Badge>

          <Text
            size="lg"
            maw={620}
            ta="center"
            lh={1.6}
            className={classes.heroDescription}
          >
            {t("landing.description")}
          </Text>

          <Group justify="center" gap="sm" mt="md">
            <Tooltip
              label={t("landing.demoComingSoon")}
              position="top"
              withArrow
            >
              <Button
                size="lg"
                radius="md"
                disabled
                className={classes.ctaPrimary}
              >
                {t("landing.cta.requestDemo")}
              </Button>
            </Tooltip>
            <Button
              component="a"
              href={learnMoreHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="light"
              size="lg"
              radius="md"
              className={classes.ctaSecondary}
            >
              {t("landing.cta.learnMore")}
            </Button>
          </Group>
        </Stack>
      </Box>

      <Divider my="xl" />

      {/* Feature grid */}
      <Stack id="features" gap="xl" pb="xl">
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
