import { describe, expect, it } from "vitest";
import { durationBarPercent, durationBarTitle, slowestDurationMs } from "@/lib/durationBar";
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

describe("bar tooltip", () => {
  it("names the slowest run in the dataset", () => {
    expect(durationBarTitle(48, { ms: 49_493, scope: "dataset" })).toBe("48% of the slowest run, 49.5 s");
  });

  it("says 'on this page' only for the page fallback", () => {
    expect(durationBarTitle(100, { ms: 8000, scope: "page" })).toBe("100% of the slowest run on this page, 8.0 s");
  });
});

describe("a run's bar does not depend on the page", () => {
  it("is the same for the same duration and dataset scale", () => {
    const datasetSlowest = 49_493;
    const pageWithSlowRun = [run("failed", 49_493), run("succeeded", 12_000)];
    const pageWithoutIt = [run("succeeded", 12_000), run("succeeded", 3000)];

    // Measured against the page, the same 12 s run gets different bars; against the dataset it does not.
    expect(durationBarPercent(12_000, slowestDurationMs(pageWithSlowRun))).not.toBe(
      durationBarPercent(12_000, slowestDurationMs(pageWithoutIt)),
    );
    expect(durationBarPercent(12_000, datasetSlowest)).toBe(24);
  });
});
