import { formatCost, formatDurationSeconds, hasInvalidDuration } from "@/lib/format";
import type { RunBase } from "@/lib/types";

// Shared by the runs table and the run detail page so both show odd values the same way.

export function WarningMark({ text }: { text: string }) {
  return (
    <span title={text} aria-label={`Warning: ${text}`} className="cursor-help text-amber-600">
      ⚠
    </span>
  );
}

export function DurationValue({ run }: { run: Pick<RunBase, "status" | "duration_ms"> }) {
  if (run.status === "running") return <span className="text-blue-700">running</span>;
  if (hasInvalidDuration(run)) {
    return (
      <span>
        — <WarningMark text="Invalid duration: the run ended before it started" />
      </span>
    );
  }
  if (run.duration_ms === null) return <span>—</span>;
  return <span>{formatDurationSeconds(run.duration_ms)}</span>;
}

export function CostValue({ costUsd }: { costUsd: number | null }) {
  if (costUsd === null) {
    return <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">unpriced</span>;
  }
  return <span>{formatCost(costUsd)}</span>;
}
