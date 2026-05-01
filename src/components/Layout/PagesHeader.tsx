"use client";

import { Container, Flex, Group, UnstyledButton } from "@mantine/core";
import Image from "next/image";
import { type ReactNode, useEffect, useState } from "react";

import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

import classes from "./PagesLayout.module.scss";

interface PagesHeaderProps {
  children: ReactNode;
}

const PagesHeader = ({ children }: PagesHeaderProps) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 100);
    };
    const onScroll = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      className={`${classes.header} ${scrolled ? classes.headerScrolled : ""}`.trim()}
    >
      <Container size="lg">
        <Flex justify="space-between" align="center" className={classes.controls}>
          <UnstyledButton
            component={Link}
            href={routes.home}
            className={classes.headerLogo}
            aria-label="Ops Tracker"
          >
            <Image
              src="/logo-light.svg"
              alt="Ops Tracker"
              width={118}
              height={32}
              className="ops-logo-light"
              style={{ display: "none" }}
              unoptimized
              priority
            />
            <Image
              src="/logo-dark.svg"
              alt=""
              aria-hidden="true"
              width={118}
              height={32}
              className="ops-logo-dark"
              style={{ display: "none" }}
              unoptimized
              priority
            />
          </UnstyledButton>
          <Group gap="xs" align="center" wrap="nowrap">
            {children}
          </Group>
        </Flex>
      </Container>
    </header>
  );
};

export default PagesHeader;
