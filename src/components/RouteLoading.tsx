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
  <Center py={compact ? "md" : "xl"} aria-busy="true" aria-live="polite">
    <Loader type="oval" size="md" {...loaderProps} />
  </Center>
);

export default RouteLoading;
