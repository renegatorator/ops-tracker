import { Container, Stack } from "@mantine/core";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import ThemeToggle from "../Theme/ThemeToggle";
import AdminNavLink from "./AdminNavLink";
import LogoutSection from "./LogoutSection";
import PagesHeader from "./PagesHeader";
import classes from "./PagesLayout.module.scss";
import SignInNavLink from "./SignInNavLink";

interface PagesLayoutProps {
  children: ReactNode;
  variant?: "centered" | "top" | "landing";
}

const PagesLayout = async ({
  children,
  variant = "centered",
}: PagesLayoutProps) => {
  const t = await getTranslations();
  const isTop = variant === "top";
  const isLanding = variant === "landing";

  const layoutClassName = `${classes.layout} ${
    isLanding ? classes.layoutLanding : ""
  }`.trim();

  return (
    <div className={layoutClassName}>
      <PagesHeader>
        <AdminNavLink />
        <SignInNavLink />
        <LogoutSection />
        <LanguageSwitcher />
        <ThemeToggle />
      </PagesHeader>
      {isLanding ? (
        <div className={classes.bodyLanding}>{children}</div>
      ) : (
        <Container
          className={`${classes.body} ${isTop ? classes.bodyTop : ""}`.trim()}
          size="lg"
        >
          <Stack
            align="center"
            justify={isTop ? "flex-start" : "center"}
            className={`${classes.content} ${isTop ? classes.contentTop : ""}`.trim()}
          >
            {children}
          </Stack>
        </Container>
      )}
      <Container className={classes.footer} size="lg">
        {t("layout.footer")}
      </Container>
    </div>
  );
};

export default PagesLayout;
