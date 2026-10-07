"use client";

import ErrorPanel from "@/components/ErrorPanel";

// Safety net for anything unexpected on any page. Backend failures are caught earlier and shown with their real message.
export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorPanel message={error.message} onRetry={retry} />;
}
