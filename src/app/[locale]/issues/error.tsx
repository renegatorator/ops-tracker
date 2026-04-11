"use client";

import { RouteSegmentError } from "@/components/RouteSegmentError";

type IssuesErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const IssuesError = (props: IssuesErrorProps) => <RouteSegmentError {...props} />;

export default IssuesError;
