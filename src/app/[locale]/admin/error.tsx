"use client";

import { RouteSegmentError } from "@/components/RouteSegmentError";

type AdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const AdminError = (props: AdminErrorProps) => <RouteSegmentError {...props} />;

export default AdminError;
