import { describe, expect, it } from "vitest";
import { durationBarPercent, slowestDurationMs } from "@/lib/durationBar";
import type { RunBase } from "@/lib/types";

function run(status: RunBase["status"], durationMs: number | null): Pick<RunBase, "status" | "duration_ms"> {
  return { status, duration_ms: durationMs };
}

describe("slowest run in the list", () => {
  it("is the longest real duration", () => {
    expect(slowestDurationMs([run("succeeded", 20_000), run("failed", 49_493), run("cancelled", 100)])).toBe(49_493);
  });

  it("ignores a running run and the invalid negative duration", () => {
    expect(slowestDurationMs([run("running", null), run("succeeded", -4000), run("succeeded", 8000)])).toBe(8000);
  });

  it("is 0 when no run has a usable duration", () => {
    expect(slowestDurationMs([run("running", null)])).toBe(0);
    expect(slowestDurationMs([])).toBe(0);
  });
});

describe("how full a duration bar is", () => {
  it("is the share of the slowest run, rounded", () => {
    // 23,649 ms of 49,493 ms = 47.8%
    expect(durationBarPercent(23_649, 49_493)).toBe(48);
    expect(durationBarPercent(49_493, 49_493)).toBe(100);
  });

  it("keeps a sliver for a very fast run, so the bar never looks empty", () => {
    expect(durationBarPercent(58, 49_493)).toBe(2);
  });

  it("does not divide by zero when there is no slowest run", () => {
    expect(durationBarPercent(1000, 0)).toBe(2);
  });
});
