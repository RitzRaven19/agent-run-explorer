import { formatCost, formatDurationSeconds, hasInvalidDuration } from "@/lib/format";
import type { RunBase } from "@/lib/types";

// Shared by the runs table and the run detail page so both show odd values the same way.

export function WarningMark({ text }: { text: string }) {
  return (
    <span title={text} aria-label={`Warning: ${text}`} className="cursor-help text-warn">
      ⚠
    </span>
  );
}

export function DurationValue({ run }: { run: Pick<RunBase, "status" | "duration_ms"> }) {
  if (run.status === "running") return <span className="text-running">running</span>;
  if (hasInvalidDuration(run)) {
    return (
      <span className="text-warn">
        — <WarningMark text="Invalid duration: the run ended before it started" />
      </span>
    );
  }
  if (run.duration_ms === null) return <span>—</span>;
  return <span>{formatDurationSeconds(run.duration_ms)}</span>;
}

export function CostValue({ costUsd }: { costUsd: number | null }) {
  if (costUsd === null) {
    return (
      <span className="rounded-full border border-warn/25 bg-warn/12 px-2 py-[3px] font-sans text-[11px] text-warn">
        unpriced
      </span>
    );
  }
  return <span>{formatCost(costUsd)}</span>;
}
