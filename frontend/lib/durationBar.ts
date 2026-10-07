import { hasInvalidDuration } from "@/lib/format";
import type { RunBase } from "@/lib/types";

type DurationFields = Pick<RunBase, "status" | "duration_ms">;

// The slowest run in the list, which the bars are measured against. Running runs (no duration yet) and the
// invalid negative duration are left out, because neither says how long a run took. 0 when no run qualifies.
export function slowestDurationMs(runs: DurationFields[]): number {
  return runs.reduce((slowest, run) => {
    if (run.duration_ms === null || hasInvalidDuration(run)) return slowest;
    return Math.max(slowest, run.duration_ms);
  }, 0);
}

// How much of the bar to fill, 2 to 100. Even a very fast run keeps a sliver so it never looks empty.
export function durationBarPercent(durationMs: number, slowestMs: number): number {
  if (slowestMs <= 0) return 2;
  return Math.max(2, Math.round((durationMs / slowestMs) * 100));
}
