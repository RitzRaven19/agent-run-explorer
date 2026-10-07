import { describe, expect, it } from "vitest";
import {
  agentBarPercent,
  axisLabels,
  costBarPercent,
  costSummary,
  dashboardEyebrow,
  dayBars,
  donutGradient,
  positionBetween,
  runsPerDaySummary,
  splitWarning,
  statusSegments,
  statusShares,
  statusSummary,
} from "@/lib/dashboard";
import type { AgentStats, DayCount, StatusCounts } from "@/lib/types";

function counts(overrides: Partial<StatusCounts>): StatusCounts {
  return { total: 0, succeeded: 0, failed: 0, cancelled: 0, running: 0, success_rate: null, ...overrides };
}

function agent(name: AgentStats["agent"], overrides: Partial<AgentStats>): AgentStats {
  return {
    ...counts({}),
    agent: name,
    total_cost_usd: 0,
    priced_count: 0,
    unpriced_count: 0,
    ...overrides,
  };
}

function days(...entries: [string, number][]): DayCount[] {
  return entries.map(([date, count]) => ({ date, count }));
}

describe("outcome donut", () => {
  it("splits the 191 finished runs of the real data into three slices and leaves the 9 running out", () => {
    const real = counts({ total: 200, succeeded: 139, failed: 44, cancelled: 8, running: 9 });
    // 139 / 191 = 72.77%, (139 + 44) / 191 = 95.81%
    expect(donutGradient(real)).toBe(
      "conic-gradient(#c4b5fd 0 72.77%, #f472b6 72.77% 95.81%, #8b87a3 95.81% 100%)",
    );
  });

  it("is a plain grey ring when no run has finished", () => {
    expect(donutGradient(counts({ total: 3, running: 3 }))).toBe("conic-gradient(#8b87a3 0 100%)");
  });
});

describe("stat tile bars", () => {
  it("shows each status as a share of all runs, running included", () => {
    const shares = statusShares(counts({ total: 200, succeeded: 139, failed: 44, cancelled: 8, running: 9 }));
    expect(shares.map((share) => share.percent)).toEqual([69.5, 22, 4, 4.5]);
  });

  it("places a value between the fastest and slowest run", () => {
    expect(positionBetween(50, 0, 100)).toBe(50);
    expect(positionBetween(1000, 1000, 11000)).toBe(0);
    // 41,530 ms between 58 ms and 49,493 ms: (41,530 - 58) / (49,493 - 58) = 83.9%
    expect(positionBetween(41530, 58, 49493)).toBeCloseTo(83.93, 1);
  });

  it("draws nothing when the value cannot be placed", () => {
    expect(positionBetween(null, 0, 100)).toBeNull();
    expect(positionBetween(50, null, 100)).toBeNull();
    // an older backend sends no min and max at all
    expect(positionBetween(50, undefined, undefined)).toBeNull();
    // all runs equally fast: there is no range to place anything in
    expect(positionBetween(50, 50, 50)).toBeNull();
  });
});

describe("runs per day bars", () => {
  it("makes the busiest day the tallest bar and marks it", () => {
    const bars = dayBars(days(["2026-08-10", 4], ["2026-08-11", 10], ["2026-08-12", 5]));
    // the tallest bar is 190 px; 4 of 10 is 76 px and 5 of 10 is 95 px
    expect(bars.map((bar) => bar.heightPx)).toEqual([76, 190, 95]);
    expect(bars.map((bar) => bar.isPeak)).toEqual([false, true, false]);
    expect(bars[1].label).toBe("11 Aug");
  });

  it("marks every day that ties for busiest", () => {
    const bars = dayBars(days(["2026-08-10", 7], ["2026-08-11", 7], ["2026-08-12", 2]));
    expect(bars.map((bar) => bar.isPeak)).toEqual([true, true, false]);
  });

  it("draws flat bars and no peak when there are no runs at all", () => {
    const bars = dayBars(days(["2026-08-10", 0], ["2026-08-11", 0]));
    expect(bars.map((bar) => bar.heightPx)).toEqual([0, 0]);
    expect(bars.some((bar) => bar.isPeak)).toBe(false);
  });
});

describe("axis labels", () => {
  function everyDay(from: string, count: number): DayCount[] {
    const start = Date.parse(`${from}T00:00:00Z`);
    return Array.from({ length: count }, (_, offset) => ({
      date: new Date(start + offset * 86_400_000).toISOString().slice(0, 10),
      count: 1,
    }));
  }

  it("picks five evenly spaced days, the first and last included", () => {
    // 43 days from 20 Jul: positions 0, 11, 21, 32 and 42
    expect(axisLabels(everyDay("2026-07-20", 43))).toEqual(["20 Jul", "31 Jul", "10 Aug", "21 Aug", "31 Aug"]);
  });

  it("labels every day when there are only a few", () => {
    expect(axisLabels(everyDay("2026-08-01", 3))).toEqual(["1 Aug", "2 Aug", "3 Aug"]);
    expect(axisLabels([])).toEqual([]);
  });
});

describe("agent bars", () => {
  it("gives the priciest agent 62% of the width, leaving room for its label", () => {
    expect(costBarPercent(2.709924, 2.709924)).toBe(62);
    expect(costBarPercent(1, 2)).toBe(31);
    expect(costBarPercent(0, 0)).toBe(0);
  });

  it("splits an agent's runs into status shares", () => {
    const one = agent("kpi-analyst", { total: 40, succeeded: 20, failed: 10, cancelled: 5, running: 5 });
    expect(statusSegments(one).map((segment) => segment.percent)).toEqual([50, 25, 12.5, 12.5]);
  });

  it("makes the agent with the most runs full width", () => {
    const busy = agent("email-drafter", { total: 46 });
    const quiet = agent("invoice-extractor", { total: 33 });
    expect(agentBarPercent(busy, [busy, quiet])).toBe(100);
    expect(agentBarPercent(quiet, [busy, quiet])).toBe(72);
  });
});

describe("data warnings", () => {
  it("separates the run id, so it can be a link", () => {
    expect(splitWarning("run_0089: error points to step 3 but only 0 steps were recorded")).toEqual({
      runId: "run_0089",
      text: "error points to step 3 but only 0 steps were recorded",
    });
  });

  it("keeps a message that does not start with a run id as it is", () => {
    expect(splitWarning("line 12: not valid JSON")).toEqual({ runId: null, text: "line 12: not valid JSON" });
  });

  it("keeps a message that spans lines whole", () => {
    expect(splitWarning("run_0031: duplicate id.\nKept line 187").text).toBe("duplicate id.\nKept line 187");
  });
});

describe("page text", () => {
  it("names the runs and the days they cover", () => {
    const covered = days(["2026-07-20", 4], ["2026-08-31", 2]);
    expect(dashboardEyebrow(200, covered)).toBe("All 200 runs · 20 Jul – 31 Aug 2026");
    expect(dashboardEyebrow(0, [])).toBe("All 0 runs");
  });

  it("summarises runs per day, and says so when a day is empty", () => {
    expect(runsPerDaySummary(days(["2026-08-11", 10], ["2026-08-12", 3]))).toBe(
      "2 days. Busiest: 11 Aug (10 runs). Every day has at least 1 run. Click a bar to see that day's runs.",
    );
    expect(runsPerDaySummary(days(["2026-08-11", 1], ["2026-08-12", 0]))).toContain("Days with no runs: 1.");
    expect(runsPerDaySummary([])).toBe("No runs to show.");
  });

  it("names the priciest and cheapest agent and counts the unpriced runs", () => {
    const agents = [
      agent("kpi-analyst", { total_cost_usd: 2.7, unpriced_count: 0 }),
      agent("support-router", { total_cost_usd: 0.8, unpriced_count: 1 }),
      agent("email-drafter", { total_cost_usd: 2.1, unpriced_count: 2 }),
    ];
    expect(costSummary(agents)).toBe("Highest kpi-analyst, lowest support-router. 3 runs across 2 agents have no price.");
    expect(costSummary([agent("kpi-analyst", { total_cost_usd: 1 })])).toBe("Highest kpi-analyst, lowest kpi-analyst.");
  });

  it("names the best and worst success rate and ignores an agent with no finished runs", () => {
    const agents = [
      agent("email-drafter", { success_rate: 0.7674 }),
      agent("support-router", { success_rate: 0.6829 }),
      agent("kpi-analyst", { success_rate: null }),
    ];
    expect(statusSummary(agents)).toBe("Best success rate email-drafter (76.74%), lowest support-router (68.29%).");
    expect(statusSummary([agent("kpi-analyst", { success_rate: null })])).toContain("No finished runs yet");
  });
});
