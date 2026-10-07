"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type ErrorPanelProps = {
  title?: string;
  message: string;
  // error.tsx passes Next's retry(); without it the panel refetches the page's server data itself.
  onRetry?: () => void;
};

export default function ErrorPanel({ title = "The runs could not be loaded", message, onRetry }: ErrorPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function retry() {
    startTransition(() => (onRetry ? onRetry() : router.refresh()));
  }

  return (
    <div
      role="alert"
      className="rounded-2xl border border-failed/30 bg-gradient-to-b from-failed/10 to-failed/[0.04] p-6"
    >
      <h2 className="text-lg font-semibold text-[#f9a8d4]">{title}</h2>
      <p className="mt-2 text-sm text-[#fce7f3]">{message}</p>
      <p className="mt-2 text-sm text-muted">
        The free backend goes to sleep when idle and can take up to a minute to wake up. Wait a moment and try again.
      </p>
      <button type="button" onClick={retry} disabled={isPending} className="outline-button mt-4 disabled:opacity-60">
        {isPending ? "Retrying…" : "Try again"}
      </button>
    </div>
  );
}
