"use client";

import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowRight,
  IconBrandTrello,
  IconBug,
  IconChartBar,
  IconCheck,
  IconLayoutKanban,
  IconShieldCheck,
  IconUsers,
} from "@tabler/icons-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import Typography from "@/components/Typography/Typography";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

import DisabledCtaButton from "./DisabledCtaButton";
import {
  LandingHeroCopyMotion,
  LandingHeroPreviewMotion,
} from "./LandingHeroMotion";
import LandingHeroProductPreview, {
  type LandingHeroPreviewCopy,
} from "./LandingHeroProductPreview";
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

const LandingPage = () => {
  const t = useTranslations();

  const previewCopy: LandingHeroPreviewCopy = {
    kanbanTitle: t("landing.preview.kanbanTitle"),
    newIssueButton: t("landing.preview.newIssueButton"),
    columnOpen: t("landing.preview.columnOpen"),
    columnProgress: t("landing.preview.columnProgress"),
    columnDone: t("landing.preview.columnDone"),
    issueTitleA: t("landing.preview.issueTitleA"),
    issueTitleB: t("landing.preview.issueTitleB"),
    issueTitleC: t("landing.preview.issueTitleC"),
    issueTitleD: t("landing.preview.issueTitleD"),
  };

  const heroHighlightLabels = [
    t("landing.hero.highlightSync"),
    t("landing.hero.highlightGithub"),
    t("landing.hero.highlightSearch"),
  ];

  return (
    <>
      <Box component="section" className={classes.heroOuter}>
        <Box className={classes.heroNoise} aria-hidden />
        <Container
          size={1200}
          px={{ base: "md", sm: "xl" }}
          py={{ base: 56, sm: 64, md: 88 }}
        >
          <Grid gutter={{ base: 36, md: 56 }} align="center">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <LandingHeroCopyMotion>
                <Stack gap="xl" className={classes.heroCopy}>
                  <Box className={classes.heroLogo} aria-hidden>
                    <Image
                      src="/logo-light.svg"
                      alt="Ops Tracker"
                      width={156}
                      height={42}
                      className="ops-logo-light"
                      style={{ display: "none" }}
                      unoptimized
                      priority
                    />
                    <Image
                      src="/logo-dark.svg"
                      alt="Ops Tracker"
                      width={156}
                      height={42}
                      className="ops-logo-dark"
                      style={{ display: "none" }}
                      unoptimized
                      priority
                    />
                  </Box>

                  <Badge
                    variant="light"
                    color="violet"
                    size="lg"
                    radius="sm"
                    className={classes.heroBadge}
                  >
                    {t("landing.badge")}
                  </Badge>

                  <Title order={1} className={classes.heroHeadline}>
                    {t("landing.hero.headline")}
                  </Title>

                  <Stack gap="sm" maw={540} className={classes.heroCopyText}>
                    <Text
                      size="lg"
                      lh={1.65}
                      className={classes.heroSubheadline}
                    >
                      {t("landing.hero.subheadline")}
                    </Text>
                    <Text
                      size="lg"
                      lh={1.65}
                      className={classes.heroSubheadlineSecondary}
                    >
                      {t("landing.hero.subheadlineLine2")}
                    </Text>
                  </Stack>

                  <Group
                    gap="md"
                    wrap="wrap"
                    mt="xs"
                    className={classes.heroHighlightGroup}
                  >
                    {heroHighlightLabels.map((label, index) => (
                      <Group key={index} gap={8} wrap="nowrap">
                        <IconCheck
                          size={18}
                          className={classes.heroHighlightCheck}
                          aria-hidden
                        />
                        <Text
                          size="sm"
                          fw={600}
                          className={classes.heroHighlightLabel}
                        >
                          {label}
                        </Text>
                      </Group>
                    ))}
                  </Group>

                  <Group
                    gap="sm"
                    mt="md"
                    wrap="wrap"
                    className={classes.heroCtaGroup}
                  >
                    <Button
                      component={Link}
                      href={routes.login}
                      size="lg"
                      radius="md"
                      className={classes.ctaPrimary}
                      rightSection={<IconArrowRight size={18} />}
                    >
                      {t("landing.cta.getStartedFree")}
                    </Button>
                    <Button
                      component="a"
                      href="#demo"
                      size="lg"
                      radius="md"
                      variant="light"
                      className={classes.ctaSecondary}
                      rightSection={<IconArrowRight size={18} />}
                    >
                      {t("landing.cta.viewDemo")}
                    </Button>
                  </Group>

                </Stack>
              </LandingHeroCopyMotion>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <LandingHeroPreviewMotion>
                <LandingHeroProductPreview copy={previewCopy} />
              </LandingHeroPreviewMotion>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      <Container size="lg">
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
        <Stack
          id="demo"
          gap="lg"
          align="center"
          pb="xl"
          style={{ textAlign: "center" }}
          className={classes.demoSection}
        >
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
                  <DisabledCtaButton size="lg" variant="filled">
                    {t("landing.demoUserButton")}
                  </DisabledCtaButton>
                </Tooltip>
                <Tooltip
                  label={t("landing.demoComingSoon")}
                  position="top"
                  withArrow
                >
                  <DisabledCtaButton size="lg" variant="light">
                    {t("landing.demoAdminButton")}
                  </DisabledCtaButton>
                </Tooltip>
              </Group>
              <Text size="xs" c="dimmed">
                {t("landing.demoDisclaimer")}
              </Text>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </>
  );
};

export default LandingPage;
