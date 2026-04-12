"use client";

import { RouteSegmentError } from "@/components/RouteSegmentError";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const DashboardError = (props: DashboardErrorProps) => (
  <RouteSegmentError {...props} />
);

export default DashboardError;
