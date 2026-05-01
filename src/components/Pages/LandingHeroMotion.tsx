"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Fragment, type ReactNode } from "react";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function LandingHeroCopyMotion({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <Fragment>{children}</Fragment>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.58, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}

export function LandingHeroPreviewMotion({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <Fragment>{children}</Fragment>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.62, delay: 0.15, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}
