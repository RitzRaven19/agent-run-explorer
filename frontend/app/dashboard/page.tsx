import type { Metadata } from "next";
import Link from "next/link";
import ChartSection from "@/components/ChartSection";
import AgentCostChart from "@/components/charts/AgentCostChart";
import AgentStatusChart from "@/components/charts/AgentStatusChart";
import RunsPerDayChart from "@/components/charts/RunsPerDayChart";
import ErrorPanel from "@/components/ErrorPanel";
import StatTile from "@/components/StatTile";
import { describeError, fetchStats } from "@/lib/api";
import { runsForAgentHref, runsForDayHref } from "@/lib/filters";
import { formatCost, formatDayLabel, formatDurationSeconds, formatPercent, formatPricedTotal } from "@/lib/format";
import type { AgentStats, DayCount, StatsResponse } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard · Agent Run Explorer",
};

const SUCCESS_RATE_FORMULA = "succeeded ÷ (succeeded + failed + cancelled)";

function durationText(durationMs: number | null): string {
  return durationMs === null ? "—" : formatDurationSeconds(durationMs);
}

function StatTiles({ stats }: { stats: StatsResponse }) {
  const { overall, duration, per_agent } = stats;
  // Every run belongs to exactly one agent, so adding up the agents gives the overall total.
  const pricedTotal = per_agent.reduce((sum, agent) => sum + agent.total_cost_usd, 0);
  const unpricedCount = per_agent.reduce((sum, agent) => sum + agent.unpriced_count, 0);
  const durationNote = `${duration.completed_count} completed runs; excludes running and invalid durations`;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <StatTile
        label="Total runs"
        value={String(overall.total)}
        note={`${overall.succeeded} succeeded · ${overall.failed} failed · ${overall.cancelled} cancelled · ${overall.running} running`}
      />
      <StatTile
        label="Success rate"
        value={formatPercent(overall.success_rate)}
        title={`${SUCCESS_RATE_FORMULA}. Running runs have not finished, so they are left out.`}
        note={`${SUCCESS_RATE_FORMULA}; ${overall.running} running runs excluded`}
      />
      <StatTile label="Median duration" value={durationText(duration.median_ms)} note={durationNote} />
      <StatTile label="p95 duration" value={durationText(duration.p95_ms)} note={durationNote} />
      <StatTile
        label="Total cost (priced runs)"
        value={formatCost(pricedTotal)}
        aside={
          unpricedCount > 0 && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
              {unpricedCount} unpriced {unpricedCount === 1 ? "run" : "runs"}
            </span>
          )
        }
        note="Unpriced runs have no cost in the data and are not counted as $0"
      />
    </div>
  );
}

function runsLabel(count: number): string {
  return `${count} ${count === 1 ? "run" : "runs"}`;
}

function runsPerDaySummary(days: DayCount[]): string {
  if (days.length === 0) return "No runs to show.";
  // On a tie, the earliest day wins, because reduce keeps the first one it found.
  const busiest = days.reduce((best, day) => (day.count > best.count ? day : best));
  const quietest = days.reduce((least, day) => (day.count < least.count ? day : least));
  const emptyDays = days.filter((day) => day.count === 0).length;
  return (
    `${days.length} days from ${formatDayLabel(days[0].date)} to ${formatDayLabel(days[days.length - 1].date)}. ` +
    `Busiest: ${formatDayLabel(busiest.date)} (${runsLabel(busiest.count)}). ` +
    `Quietest: ${formatDayLabel(quietest.date)} (${runsLabel(quietest.count)}). ` +
    `Days with no runs: ${emptyDays}. Click a bar to see that day's runs.`
  );
}

function RunsPerDayTable({ days }: { days: DayCount[] }) {
  return (
    <table className="w-full max-w-sm text-left">
      <thead className="text-xs uppercase text-slate-600">
        <tr>
          <th className="py-1">Day (UTC)</th>
          <th className="py-1 text-right">Runs</th>
        </tr>
      </thead>
      <tbody>
        {days.map((day) => (
          <tr key={day.date} className="border-t border-slate-100">
            <td className="py-1">
              <Link href={runsForDayHref(day.date)} className="text-blue-700 hover:underline">
                {formatDayLabel(day.date)}
              </Link>
            </td>
            <td className="py-1 text-right">{day.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AgentLink({ agent }: { agent: AgentStats }) {
  return (
    <Link href={runsForAgentHref(agent.agent)} className="text-blue-700 hover:underline">
      {agent.agent}
    </Link>
  );
}

function costSummary(agents: AgentStats[]): string {
  if (agents.length === 0) return "No runs to show.";
  const highest = agents.reduce((best, agent) => (agent.total_cost_usd > best.total_cost_usd ? agent : best));
  const lowest = agents.reduce((least, agent) => (agent.total_cost_usd < least.total_cost_usd ? agent : least));
  const unpriced = agents.reduce((sum, agent) => sum + agent.unpriced_count, 0);
  const agentsWithUnpriced = agents.filter((agent) => agent.unpriced_count > 0).length;
  return (
    `Highest: ${highest.agent} (${formatCost(highest.total_cost_usd)}). ` +
    `Lowest: ${lowest.agent} (${formatCost(lowest.total_cost_usd)}). ` +
    `${runsLabel(unpriced)} across ${agentsWithUnpriced} agents have no price and are left out of the totals. ` +
    `Click a bar to see that agent's runs.`
  );
}

function AgentCostTable({ agents }: { agents: AgentStats[] }) {
  return (
    <table className="w-full text-left">
      <thead className="text-xs uppercase text-slate-600">
        <tr>
          <th className="py-1">Agent</th>
          <th className="py-1 text-right">Priced total</th>
          <th className="py-1 text-right">Priced runs</th>
          <th className="py-1 text-right">Unpriced runs</th>
        </tr>
      </thead>
      <tbody>
        {agents.map((agent) => (
          <tr key={agent.agent} className="border-t border-slate-100">
            <td className="py-1">
              <AgentLink agent={agent} />
            </td>
            <td className="py-1 text-right font-mono">{formatPricedTotal(agent.total_cost_usd, agent.unpriced_count)}</td>
            <td className="py-1 text-right">{agent.priced_count}</td>
            <td className="py-1 text-right">{agent.unpriced_count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function statusSummary(agents: AgentStats[]): string {
  // An agent with only running runs has no rate yet, so it cannot be best or worst.
  const rated = agents.filter((agent) => agent.success_rate !== null);
  if (rated.length === 0) return "No finished runs yet, so there is no success rate to compare.";
  const rate = (agent: AgentStats) => agent.success_rate ?? 0;
  const best = rated.reduce((top, agent) => (rate(agent) > rate(top) ? agent : top));
  const worst = rated.reduce((bottom, agent) => (rate(agent) < rate(bottom) ? agent : bottom));
  return (
    `Best success rate: ${best.agent} (${formatPercent(best.success_rate)}). ` +
    `Lowest: ${worst.agent} (${formatPercent(worst.success_rate)}). ` +
    `Running runs are shown but not counted in the rate. Click a bar to see that agent's runs.`
  );
}

function AgentStatusTable({ agents }: { agents: AgentStats[] }) {
  return (
    <table className="w-full text-left">
      <thead className="text-xs uppercase text-slate-600">
        <tr>
          <th className="py-1">Agent</th>
          <th className="py-1 text-right">Succeeded</th>
          <th className="py-1 text-right">Failed</th>
          <th className="py-1 text-right">Cancelled</th>
          <th className="py-1 text-right">Running</th>
          <th className="py-1 text-right">Success rate</th>
        </tr>
      </thead>
      <tbody>
        {agents.map((agent) => (
          <tr key={agent.agent} className="border-t border-slate-100">
            <td className="py-1">
              <AgentLink agent={agent} />
            </td>
            <td className="py-1 text-right">{agent.succeeded}</td>
            <td className="py-1 text-right">{agent.failed}</td>
            <td className="py-1 text-right">{agent.cancelled}</td>
            <td className="py-1 text-right">{agent.running}</td>
            <td className="py-1 text-right">{formatPercent(agent.success_rate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DataWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <details className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <summary className="cursor-pointer font-medium">⚠ Data warnings ({warnings.length})</summary>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </details>
  );
}

// Always the global picture (decision 4): fetchStats() with no filters. /runs sends filters to the same endpoint.
export default async function DashboardPage() {
  let stats: StatsResponse;
  try {
    stats = await fetchStats();
  } catch (error) {
    return <ErrorPanel title="The dashboard could not be loaded" message={describeError(error)} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <StatTiles stats={stats} />
      <ChartSection
        id="runs-per-day"
        title="Runs per day"
        summary={runsPerDaySummary(stats.runs_per_day)}
        chart={<RunsPerDayChart days={stats.runs_per_day} />}
        table={<RunsPerDayTable days={stats.runs_per_day} />}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSection
          id="cost-per-agent"
          title="Cost per agent (priced runs)"
          summary={costSummary(stats.per_agent)}
          chart={<AgentCostChart agents={stats.per_agent} />}
          table={<AgentCostTable agents={stats.per_agent} />}
        />
        <ChartSection
          id="status-per-agent"
          title="Runs by status per agent"
          summary={statusSummary(stats.per_agent)}
          chart={<AgentStatusChart agents={stats.per_agent} />}
          table={<AgentStatusTable agents={stats.per_agent} />}
        />
      </div>
      <DataWarnings warnings={stats.data_warnings} />
    </div>
  );
}
