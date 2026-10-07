import { formatDayLabel, formatPercent, formatPricedTotal } from "@/lib/format";
import { STATUS_COLORS } from "@/lib/statusColors";
import { RUN_STATUSES, type AgentStats, type DayCount, type RunStatus, type StatusCounts } from "@/lib/types";

// Plain calculations behind the dashboard's bars, donut and summaries, kept apart from the components so they can be tested.

// A run that is still running has no outcome yet, so every "share of runs that finished" leaves it out.
export function finishedCount(counts: StatusCounts): number {
  return counts.succeeded + counts.failed + counts.cancelled;
}

function twoDecimals(value: number): number {
  return Number(value.toFixed(2));
}

// The donut: succeeded, failed and cancelled as slices of the finished runs. No finished runs gives a plain grey ring.
export function donutGradient(counts: StatusCounts): string {
  const finished = finishedCount(counts);
  if (finished === 0) return `conic-gradient(${STATUS_COLORS.cancelled} 0 100%)`;
  const succeededEnd = twoDecimals((counts.succeeded / finished) * 100);
  const failedEnd = twoDecimals(((counts.succeeded + counts.failed) / finished) * 100);
  return (
    `conic-gradient(${STATUS_COLORS.succeeded} 0 ${succeededEnd}%, ` +
    `${STATUS_COLORS.failed} ${succeededEnd}% ${failedEnd}%, ` +
    `${STATUS_COLORS.cancelled} ${failedEnd}% 100%)`
  );
}

// Each status as a share of all runs (running included), for the thin bar on the "Total runs" tile.
export function statusShares(counts: StatusCounts): { status: RunStatus; percent: number }[] {
  return RUN_STATUSES.map((status) => ({
    status,
    percent: counts.total === 0 ? 0 : (counts[status] / counts.total) * 100,
  }));
}

// Where a value sits between the fastest and slowest, 0 to 100, for the median and p95 tile bars.
// null when it cannot be placed: a missing number (also an older backend without min and max) or no spread to measure.
export function positionBetween(value: number | null, min: number | null | undefined, max: number | null | undefined): number | null {
  if (value === null || typeof min !== "number" || typeof max !== "number" || max <= min) return null;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

const TALLEST_DAY_BAR_PX = 190;

export type DayBar = { date: string; label: string; count: number; heightPx: number; isPeak: boolean };

// One bar per day; the busiest day(s) are marked so the chart can light them up.
export function dayBars(days: DayCount[]): DayBar[] {
  const busiest = days.reduce((most, day) => Math.max(most, day.count), 0);
  return days.map((day) => ({
    date: day.date,
    label: formatDayLabel(day.date),
    count: day.count,
    heightPx: busiest === 0 ? 0 : (day.count / busiest) * TALLEST_DAY_BAR_PX,
    isPeak: busiest > 0 && day.count === busiest,
  }));
}

// Evenly spaced day labels for under the bars: the first day, the last day and some in between.
export function axisLabels(days: DayCount[], labelCount = 5): string[] {
  if (days.length === 0) return [];
  if (days.length <= labelCount) return days.map((day) => formatDayLabel(day.date));
  return Array.from({ length: labelCount }, (_, position) => {
    const index = Math.round((position * (days.length - 1)) / (labelCount - 1));
    return formatDayLabel(days[index].date);
  });
}

const LONGEST_COST_BAR_PERCENT = 62;

// The priciest agent gets a bar 62% wide, which leaves room for its label at the end of the bar.
export function costBarPercent(costUsd: number, highestCostUsd: number): number {
  if (highestCostUsd <= 0) return 0;
  return Math.round((costUsd / highestCostUsd) * LONGEST_COST_BAR_PERCENT);
}

// An agent's four status segments as shares of that agent's own runs.
export function statusSegments(agent: AgentStats): { status: RunStatus; percent: number }[] {
  return RUN_STATUSES.map((status) => ({ status, percent: agent.total === 0 ? 0 : (agent[status] / agent.total) * 100 }));
}

// The agent with the most runs gets a full-width bar, so the bars also compare how many runs each agent has.
export function agentBarPercent(agent: AgentStats, agents: AgentStats[]): number {
  const most = agents.reduce((highest, item) => Math.max(highest, item.total), 0);
  return most === 0 ? 0 : Math.round((agent.total / most) * 100);
}

// "run_0089: error points to ..." -> the run id and the rest, so the id can become a link. Anything else stays text.
export function splitWarning(warning: string): { runId: string | null; text: string } {
  const match = /^(run_\w+): ([\s\S]*)$/.exec(warning);
  return match ? { runId: match[1], text: match[2] } : { runId: null, text: warning };
}

function runsLabel(count: number): string {
  return `${count} ${count === 1 ? "run" : "runs"}`;
}

// The line above the title: how many runs and which days they cover, e.g. "All 200 runs · 20 Jul – 31 Aug 2026".
export function dashboardEyebrow(total: number, days: DayCount[]): string {
  if (days.length === 0) return `All ${total} runs`;
  const last = days[days.length - 1].date;
  return `All ${total} runs · ${formatDayLabel(days[0].date)} – ${formatDayLabel(last)} ${last.slice(0, 4)}`;
}

// The sentences under each chart's title give the main takeaway for people who cannot see the chart.
export function runsPerDaySummary(days: DayCount[]): string {
  if (days.length === 0) return "No runs to show.";
  // On a tie, the earliest day wins, because reduce keeps the first one it found.
  const busiest = days.reduce((best, day) => (day.count > best.count ? day : best));
  const emptyDays = days.filter((day) => day.count === 0).length;
  const coverage = emptyDays === 0 ? "Every day has at least 1 run." : `Days with no runs: ${emptyDays}.`;
  return `${days.length} days. Busiest: ${formatDayLabel(busiest.date)} (${runsLabel(busiest.count)}). ${coverage} Click a bar to see that day's runs.`;
}

export function costSummary(agents: AgentStats[]): string {
  if (agents.length === 0) return "No runs to show.";
  const highest = agents.reduce((best, agent) => (agent.total_cost_usd > best.total_cost_usd ? agent : best));
  const lowest = agents.reduce((least, agent) => (agent.total_cost_usd < least.total_cost_usd ? agent : least));
  const unpriced = agents.reduce((sum, agent) => sum + agent.unpriced_count, 0);
  const agentsWithUnpriced = agents.filter((agent) => agent.unpriced_count > 0).length;
  const gap = unpriced > 0 ? ` ${runsLabel(unpriced)} across ${agentsWithUnpriced} agents have no price.` : "";
  return `Highest ${highest.agent}, lowest ${lowest.agent}.${gap}`;
}

export function statusSummary(agents: AgentStats[]): string {
  // An agent with only running runs has no rate yet, so it cannot be best or worst.
  const rated = agents.filter((agent) => agent.success_rate !== null);
  if (rated.length === 0) return "No finished runs yet, so there is no success rate to compare.";
  const rate = (agent: AgentStats) => agent.success_rate ?? 0;
  const best = rated.reduce((top, agent) => (rate(agent) > rate(top) ? agent : top));
  const worst = rated.reduce((bottom, agent) => (rate(agent) < rate(bottom) ? agent : bottom));
  return `Best success rate ${best.agent} (${formatPercent(best.success_rate)}), lowest ${worst.agent} (${formatPercent(worst.success_rate)}).`;
}

// What a screen reader announces for one agent's cost or status row.
export function agentCostLabel(agent: AgentStats): string {
  const total = formatPricedTotal(agent.total_cost_usd, agent.unpriced_count);
  return `${agent.agent}: ${total}. ${agent.priced_count} priced runs, ${agent.unpriced_count} unpriced. Open this agent's runs.`;
}

export function agentStatusLabel(agent: AgentStats): string {
  return (
    `${agent.agent}: ${agent.succeeded} succeeded, ${agent.failed} failed, ${agent.cancelled} cancelled, ` +
    `${agent.running} running · success rate ${formatPercent(agent.success_rate)}`
  );
}
