"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type ErrorPanelProps = {
  message: string;
  // error.tsx passes Next's retry(); without it the panel refetches the page's server data itself.
  onRetry?: () => void;
};

export default function ErrorPanel({ message, onRetry }: ErrorPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function retry() {
    startTransition(() => (onRetry ? onRetry() : router.refresh()));
  }

  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="text-lg font-semibold text-red-800">The runs could not be loaded</h2>
      <p className="mt-2 text-sm text-red-700">{message}</p>
      <p className="mt-2 text-sm text-slate-600">
        The free backend goes to sleep when idle and can take up to a minute to wake up. Wait a moment and try again.
      </p>
      <button
        type="button"
        onClick={retry}
        disabled={isPending}
        className="mt-4 rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {isPending ? "Retrying…" : "Try again"}
      </button>
    </div>
  );
}
