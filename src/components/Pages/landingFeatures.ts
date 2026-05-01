import {
  type Icon,
  IconBrandTrello,
  IconBug,
  IconChartBar,
  IconLayoutKanban,
  IconShieldCheck,
  IconUsers,
} from "@tabler/icons-react";

export type LandingFeature = {
  icon: Icon;
  titleKey: string;
  descKey: string;
  color: string;
};

export const landingFeatures: readonly LandingFeature[] = [
  {
    icon: IconLayoutKanban,
    titleKey: "landing.features.kanban.title",
    descKey: "landing.features.kanban.description",
    color: "violet",
  },
  {
    icon: IconBug,
    titleKey: "landing.features.tracking.title",
    descKey: "landing.features.tracking.description",
    color: "blue",
  },
  {
    icon: IconUsers,
    titleKey: "landing.features.team.title",
    descKey: "landing.features.team.description",
    color: "teal",
  },
  {
    icon: IconShieldCheck,
    titleKey: "landing.features.audit.title",
    descKey: "landing.features.audit.description",
    color: "orange",
  },
  {
    icon: IconChartBar,
    titleKey: "landing.features.dashboard.title",
    descKey: "landing.features.dashboard.description",
    color: "pink",
  },
  {
    icon: IconBrandTrello,
    titleKey: "landing.features.projects.title",
    descKey: "landing.features.projects.description",
    color: "cyan",
  },
] as const;
