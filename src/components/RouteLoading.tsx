"use client";

import { Center, Loader, type LoaderProps } from "@mantine/core";

type RouteLoadingProps = {
  /** Tighter layout when shown inside a stacked admin page */
  compact?: boolean;
  loaderProps?: LoaderProps;
};

const RouteLoading = ({
  compact = false,
  loaderProps,
}: RouteLoadingProps) => (
  <Center
    aria-busy="true"
    aria-live="polite"
    style={
      compact
        ? { padding: "var(--mantine-spacing-md) 0" }
        : {
            minHeight:
              "calc(100dvh - var(--app-shell-header-height, 56px) - 2 * var(--mantine-spacing-md))",
          }
    }
  >
    <Loader type="oval" size="md" {...loaderProps} />
  </Center>
);

export default RouteLoading;
