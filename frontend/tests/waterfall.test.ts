import { describe, expect, it } from "vitest";
import { buildWaterfall } from "@/lib/waterfall";
import type { Step } from "@/lib/types";

function step(index: number, startedAt: string, durationMs: number | null): Step {
  return {
    index,
    name: `step_${index}`,
    tool: "llm",
    status: "succeeded",
    started_at: startedAt,
    duration_ms: durationMs,
    input: "",
    output: null,
    tokens: { input: 0, output: 0 },
  };
}

describe("step timeline", () => {
  // run_0136: two steps of 7,676 ms and 7,208 ms, the second starting the moment the first ends.
  const run136 = {
    started_at: "2026-07-24T15:18:54Z",
    steps: [step(0, "2026-07-24T15:18:54Z", 7676), step(1, "2026-07-24T15:19:01.676000Z", 7208)],
  };

  it("lays the steps out end to end, using their real start times", () => {
    const { totalMs, bars } = buildWaterfall(run136);

    expect(totalMs).toBe(14_884);
    expect(bars[0].leftPercent).toBe(0);
    // 7,676 / 14,884 = 51.57%
    expect(bars[0].widthPercent).toBeCloseTo(51.57, 1);
    expect(bars[1].leftPercent).toBeCloseTo(51.57, 1);
    expect(bars[1].widthPercent).toBeCloseTo(48.43, 1);
    // the second bar ends exactly at the right edge
    expect(bars[1].leftPercent + bars[1].widthPercent).toBeCloseTo(100, 5);
  });

  it("keeps a gap where one step starts later than the one before ended", () => {
    const { bars } = buildWaterfall({
      started_at: "2026-08-01T10:00:00Z",
      steps: [step(0, "2026-08-01T10:00:00Z", 1000), step(1, "2026-08-01T10:00:03Z", 1000)],
    });
    // total is 4 s: the first bar covers 0-25%, the second 75-100%, with a gap between
    expect(bars[0].widthPercent).toBe(25);
    expect(bars[1].leftPercent).toBe(75);
  });

  it("gives a step that is still running a zero-width bar and no duration", () => {
    const { totalMs, bars } = buildWaterfall({
      started_at: "2026-08-01T10:00:00Z",
      steps: [step(0, "2026-08-01T10:00:00Z", 2000), step(1, "2026-08-01T10:00:02Z", null)],
    });
    expect(totalMs).toBe(2000);
    expect(bars[1].durationMs).toBeNull();
    expect(bars[1].widthPercent).toBe(0);
    expect(bars[1].leftPercent).toBe(100);
  });

  it("is empty for a run with no steps (run_0089)", () => {
    expect(buildWaterfall({ started_at: "2026-08-23T22:31:13Z", steps: [] })).toEqual({ totalMs: 0, bars: [] });
  });
});
