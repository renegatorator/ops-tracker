"use client";

import { RouteSegmentError } from "@/components/RouteSegmentError";

type LocaleErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const LocaleSegmentError = (props: LocaleErrorProps) => (
  <RouteSegmentError {...props} />
);

export default LocaleSegmentError;
