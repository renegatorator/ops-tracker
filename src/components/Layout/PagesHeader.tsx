"use client";

import { Container, Flex } from "@mantine/core";
import { type ReactNode, useEffect, useState } from "react";

import classes from "./PagesLayout.module.scss";

interface PagesHeaderProps {
  children: ReactNode;
}

const PagesHeader = ({ children }: PagesHeaderProps) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`${classes.header} ${scrolled ? classes.headerScrolled : ""}`.trim()}
    >
      <Container size="lg">
        <Flex justify="flex-end" align="center" className={classes.controls}>
          {children}
        </Flex>
      </Container>
    </header>
  );
};

export default PagesHeader;
