import { Container, Flex, Stack } from "@mantine/core";
import { getTranslations } from "next-intl/server";

import LanguageSwitcher from "../Language/LanguageSwitcher";
import ThemeToggle from "../Theme/ThemeToggle";
import classes from "./PagesLayout.module.scss";

type PagesLayoutProps = {
  children: React.ReactNode;
};

export default async function PagesLayout({ children }: PagesLayoutProps) {
  const t = await getTranslations("layout");

  return (
    <div className={classes.layout}>
      <Container className={classes.header} size="lg">
        <Flex justify="flex-end" align="flex-end" className={classes.controls}>
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
}
