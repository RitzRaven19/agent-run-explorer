import { AGENT_NAMES, RUN_STATUSES, type AgentName, type RunStatus, type StatsResponse } from "@/lib/types";

// How many runs there are per status and per agent in the whole dataset, shown on the filter chips.
export type FilterCounts = { status: Record<RunStatus, number>; agent: Record<AgentName, number> };

export function toFilterCounts(stats: StatsResponse): FilterCounts {
  const status = Object.fromEntries(RUN_STATUSES.map((name) => [name, stats.overall[name]])) as Record<RunStatus, number>;
  // An agent missing from the response has no runs, so it counts 0 instead of showing no number at all.
  const agent = Object.fromEntries(
    AGENT_NAMES.map((name) => [name, stats.per_agent.find((item) => item.agent === name)?.total ?? 0]),
  ) as Record<AgentName, number>;
  return { status, agent };
}
