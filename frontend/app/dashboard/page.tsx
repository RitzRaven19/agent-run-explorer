import type { Metadata } from "next";
import Link from "next/link";
import ChartSection from "@/components/ChartSection";
import RunsPerDayChart from "@/components/charts/RunsPerDayChart";
import ErrorPanel from "@/components/ErrorPanel";
import StatTile from "@/components/StatTile";
import { describeError, fetchStats } from "@/lib/api";
import { runsForDayHref } from "@/lib/filters";
import { formatCost, formatDayLabel, formatDurationSeconds, formatPercent } from "@/lib/format";
import type { DayCount, StatsResponse } from "@/lib/types";

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
      <DataWarnings warnings={stats.data_warnings} />
    </div>
  );
}
