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
        <Flex justify="flex-end" align="center" className={classes.controls}>
          {children}
        </Flex>
      </Container>
    </header>
  );
};

export default PagesHeader;
