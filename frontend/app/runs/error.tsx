"use client";

export default function RunsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="text-lg font-semibold text-red-800">The runs could not be loaded</h2>
      <p className="mt-2 text-sm text-red-700">{error.message}</p>
      <p className="mt-2 text-sm text-slate-600">
        The free backend goes to sleep when idle and can take up to a minute to wake up. Wait a moment and try again.
      </p>
      {/* retry() asks the server to fetch again; a plain re-render would just show the same error. */}
      <button
        type="button"
        onClick={() => retry()}
        className="mt-4 rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
      >
        Try again
      </button>
    </div>
  );
}
