import { describe, expect, it } from "vitest";
import { toFilterCounts } from "@/lib/filterCounts";
import type { AgentStats, StatsResponse } from "@/lib/types";

function agent(name: AgentStats["agent"], total: number): AgentStats {
  return {
    agent: name,
    total,
    succeeded: 0,
    failed: 0,
    cancelled: 0,
    running: 0,
    success_rate: null,
    total_cost_usd: 0,
    priced_count: 0,
    unpriced_count: 0,
  };
}

function stats(perAgent: AgentStats[]): StatsResponse {
  return {
    overall: { total: 200, succeeded: 139, failed: 44, cancelled: 8, running: 9, success_rate: 0.7277 },
    per_agent: perAgent,
    duration: { median_ms: null, p95_ms: null, min_ms: null, max_ms: null, completed_count: 0 },
    runs_per_day: [],
    data_warnings: [],
  };
}

describe("filter chip counts", () => {
  it("reads the status and agent totals from the stats", () => {
    const counts = toFilterCounts(stats([agent("email-drafter", 46), agent("kpi-analyst", 39)]));

    expect(counts.status).toEqual({ succeeded: 139, failed: 44, cancelled: 8, running: 9 });
    expect(counts.agent["email-drafter"]).toBe(46);
    expect(counts.agent["kpi-analyst"]).toBe(39);
  });

  it("counts an agent the stats do not mention as 0", () => {
    expect(toFilterCounts(stats([agent("email-drafter", 46)])).agent["support-router"]).toBe(0);
  });
});
