import type { Run, RunStatus, ToolName } from "@/lib/types";

export type WaterfallBar = {
  index: number;
  name: string;
  tool: ToolName;
  status: RunStatus;
  // Where the bar starts and how wide it is, as percentages of the whole timeline.
  leftPercent: number;
  widthPercent: number;
  // null for a step that is still running and has no duration yet.
  durationMs: number | null;
};

export type Waterfall = { totalMs: number; bars: WaterfallBar[] };

// Lays the steps out on one timeline using their real start times, so a gap or an overlap would show.
// (In this dataset every step starts the moment the one before it ends.) The timeline is as long as the
// last step's end, which is the sum of the step times, not the run's own duration_ms: that one can be missing
// (running) or invalid (run_0064), and the steps are what the timeline describes.
export function buildWaterfall(run: Pick<Run, "started_at" | "steps">): Waterfall {
  const runStart = Date.parse(run.started_at);
  const placed = run.steps.map((step) => {
    const offsetMs = Date.parse(step.started_at) - runStart;
    return { step, offsetMs, endMs: offsetMs + (step.duration_ms ?? 0) };
  });
  const totalMs = placed.reduce((latest, item) => Math.max(latest, item.endMs), 0);
  if (totalMs <= 0) return { totalMs: 0, bars: [] };

  const bars = placed.map(({ step, offsetMs }) => ({
    index: step.index,
    name: step.name,
    tool: step.tool,
    status: step.status,
    leftPercent: (Math.max(offsetMs, 0) / totalMs) * 100,
    widthPercent: ((step.duration_ms ?? 0) / totalMs) * 100,
    durationMs: step.duration_ms,
  }));
  return { totalMs, bars };
}
