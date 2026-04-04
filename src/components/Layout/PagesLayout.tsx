import { Container, Flex, Stack } from "@mantine/core";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import LanguageSwitcher from "../Language/LanguageSwitcher";
import ThemeToggle from "../Theme/ThemeToggle";
import LogoutSection from "./LogoutSection";
import classes from "./PagesLayout.module.scss";

interface PagesLayoutProps {
  children: ReactNode;
}

const PagesLayout = async ({ children }: PagesLayoutProps) => {
  const t = await getTranslations("layout");

  return (
    <div className={classes.layout}>
      <Container className={classes.header} size="lg">
        <Flex justify="flex-end" align="flex-end" className={classes.controls}>
          <LogoutSection />
          <LanguageSwitcher />
          <ThemeToggle />
        </Flex>
      </Container>
      <Container className={classes.body} size="lg">
        <Stack align="center" justify="center" className={classes.content}>
          {children}
        </Stack>
      </Container>
      <Container className={classes.footer} size="lg">
        {t("footer")}
      </Container>
    </div>
  );
};

export default PagesLayout;
