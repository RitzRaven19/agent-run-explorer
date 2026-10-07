"use client";

import ErrorPanel from "@/components/ErrorPanel";

// Safety net for anything unexpected. Backend failures are caught earlier and shown with their real message.
export default function RunsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorPanel message={error.message} onRetry={retry} />;
}
