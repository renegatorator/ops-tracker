"use client";

import RouteSegmentError from "@/components/RouteSegmentError";

type IssueDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const IssueDetailError = (props: IssueDetailErrorProps) => (
  <RouteSegmentError {...props} />
);

export default IssueDetailError;
