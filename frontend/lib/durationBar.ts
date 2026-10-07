import { formatDurationSeconds, hasInvalidDuration } from "@/lib/format";
import type { RunBase } from "@/lib/types";

type DurationFields = Pick<RunBase, "status" | "duration_ms">;

// What a bar is measured against: the slowest run in the whole dataset, or (only when the stats could not be
// fetched) the slowest run on the current page.
export type DurationScale = { ms: number; scope: "dataset" | "page" };

// The slowest run in a list. Running runs (no duration yet) and the invalid negative duration are left out,
// because neither says how long a run took. 0 when no run qualifies. This is the fallback scale for one page.
export function slowestDurationMs(runs: DurationFields[]): number {
  return runs.reduce((slowest, run) => {
    if (run.duration_ms === null || hasInvalidDuration(run)) return slowest;
    return Math.max(slowest, run.duration_ms);
  }, 0);
}

// The tooltip on a bar, e.g. "48% of the slowest run, 49.5 s".
export function durationBarTitle(percent: number, scale: DurationScale): string {
  const where = scale.scope === "page" ? " on this page" : "";
  return `${percent}% of the slowest run${where}, ${formatDurationSeconds(scale.ms)}`;
}

// How much of the bar to fill, 2 to 100. Even a very fast run keeps a sliver so it never looks empty.
export function durationBarPercent(durationMs: number, slowestMs: number): number {
  if (slowestMs <= 0) return 2;
  return Math.max(2, Math.round((durationMs / slowestMs) * 100));
}
