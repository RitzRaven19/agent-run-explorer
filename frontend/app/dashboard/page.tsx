import type { Metadata } from "next";
import Link from "next/link";
import AgentCards from "@/components/AgentCards";
import ChartSection from "@/components/ChartSection";
import AgentCostChart from "@/components/charts/AgentCostChart";
import AgentStatusChart from "@/components/charts/AgentStatusChart";
import RunsPerDayChart from "@/components/charts/RunsPerDayChart";
import ErrorPanel from "@/components/ErrorPanel";
import OutcomeDonut from "@/components/OutcomeDonut";
import PageHeading from "@/components/PageHeading";
import StatTile from "@/components/StatTile";
import { describeError, fetchStats } from "@/lib/api";
import {
  costSummary,
  dashboardEyebrow,
  finishedCount,
  positionBetween,
  runsPerDaySummary,
  splitWarning,
  statusShares,
  statusSummary,
} from "@/lib/dashboard";
import { DEFAULT_FILTERS, runDetailHref } from "@/lib/filters";
import { formatCost, formatDurationSeconds, formatPercent } from "@/lib/format";
import { STATUS_COLORS } from "@/lib/statusColors";
import type { StatsResponse } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard · Agent Run Explorer",
};

const SUCCESS_RATE_FORMULA = "succeeded ÷ (succeeded + failed + cancelled)";
const TILE_TRACK = "relative mt-1 h-[5px] rounded bg-white/[0.07]";

function durationText(durationMs: number | null): string {
  return durationMs === null ? "—" : formatDurationSeconds(durationMs);
}

// A thin bar under the median or p95 figure: the filled part runs to the value, a white tick marks it.
// Nothing is drawn when the value cannot be placed between the fastest and slowest run.
function PositionBar({ percent, title }: { percent: number | null; title: string }) {
  if (percent === null) return null;
  return (
    <span title={title} className={TILE_TRACK}>
      <span
        className="absolute top-0 bottom-0 left-0 rounded"
        style={{ width: `${percent}%`, background: "linear-gradient(90deg, #4c1d95, #a78bfa)" }}
      />
      <span className="absolute -top-[3px] h-[11px] w-0.5 bg-white" style={{ left: `${percent}%` }} />
    </span>
  );
}

function StatTiles({ stats }: { stats: StatsResponse }) {
  const { overall, duration, per_agent } = stats;
  const finished = finishedCount(overall);
  // Every run belongs to exactly one agent, so adding up the agents gives the overall total.
  const pricedTotal = per_agent.reduce((sum, agent) => sum + agent.total_cost_usd, 0);
  const unpricedCount = per_agent.reduce((sum, agent) => sum + agent.unpriced_count, 0);
  const range =
    typeof duration.min_ms === "number" && typeof duration.max_ms === "number"
      ? `the fastest (${formatDurationSeconds(duration.min_ms)}) and slowest (${formatDurationSeconds(duration.max_ms)}) run`
      : "the fastest and slowest run";

  return (
    <section aria-label="Key numbers" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
      <StatTile
        label="Total runs"
        value={String(overall.total)}
        note={`${overall.succeeded} succeeded · ${overall.failed} failed · ${overall.cancelled} cancelled · ${overall.running} running`}
      >
        <span title="Share of runs by status" className="mt-1 flex h-[5px] overflow-hidden rounded">
          {statusShares(overall).map(({ status, percent }) => (
            <span key={status} style={{ width: `${percent}%`, background: STATUS_COLORS[status] }} />
          ))}
        </span>
      </StatTile>
      <StatTile
        label="Success rate"
        value={formatPercent(overall.success_rate)}
        title={`${SUCCESS_RATE_FORMULA} = ${overall.succeeded} ÷ ${finished}`}
        note={`${overall.succeeded} ÷ ${finished} finished runs; ${overall.running} running excluded`}
      >
        <span title={`${formatPercent(overall.success_rate)} succeeded of finished runs`} className="mt-1 h-[5px] overflow-hidden rounded bg-failed/35">
          <span className="block h-full bg-succeeded" style={{ width: `${(overall.success_rate ?? 0) * 100}%` }} />
        </span>
      </StatTile>
      <StatTile
        label="Median duration"
        value={durationText(duration.median_ms)}
        note={`${duration.completed_count} runs with a valid duration`}
      >
        <PositionBar
          percent={positionBetween(duration.median_ms, duration.min_ms, duration.max_ms)}
          title={`Where the median sits between ${range}`}
        />
      </StatTile>
      <StatTile label="p95 duration" value={durationText(duration.p95_ms)} note={`Nearest-rank, same ${duration.completed_count} runs`}>
        <PositionBar
          percent={positionBetween(duration.p95_ms, duration.min_ms, duration.max_ms)}
          title={`Where p95 sits between ${range}`}
        />
      </StatTile>
      <StatTile label="Total cost (priced runs)" value={formatCost(pricedTotal)}>
        {unpricedCount > 0 ? (
          <Link
            href="/runs"
            title="Runs with no price are not counted as $0"
            className="self-start rounded-full border border-warn/25 bg-warn/12 px-[9px] py-[3px] text-[11px] text-warn"
          >
            {unpricedCount} unpriced {unpricedCount === 1 ? "run" : "runs"} →
          </Link>
        ) : (
          <span className="text-xs text-dim">Every run has a price</span>
        )}
      </StatTile>
    </section>
  );
}

function DataWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <details className="group glass rounded-2xl px-5 py-4">
      <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-ink">
            <span aria-hidden="true" className="text-warn">
              ⚠
            </span>{" "}
            {warnings.length} data {warnings.length === 1 ? "anomaly" : "anomalies"}
          </span>
          <span className="text-xs text-dim">Flagged by the loader instead of silently fixed</span>
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className="ml-auto shrink-0 text-muted transition-transform group-open:rotate-180"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <ul className="mt-4 grid list-none grid-cols-1 gap-x-6 gap-y-2.5 p-0 text-[13px] md:grid-cols-2">
        {warnings.map((warning) => {
          const { runId, text } = splitWarning(warning);
          return (
            <li key={warning} className="flex min-w-0 items-center gap-2.5">
              {runId && (
                <Link
                  href={runDetailHref(runId, DEFAULT_FILTERS)}
                  className="shrink-0 rounded-full bg-accent/15 px-2.5 py-0.5 font-mono text-[11px] text-accent hover:bg-accent/25"
                >
                  {runId}
                </Link>
              )}
              <span title={text} className="min-w-0 truncate text-muted">
                {text}
              </span>
            </li>
          );
        })}
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
    return (
      <div className="pt-12 pb-[72px]">
        <ErrorPanel title="The dashboard could not be loaded" message={describeError(error)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-12 pb-[72px]">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <PageHeading eyebrow={dashboardEyebrow(stats.overall.total, stats.runs_per_day)} title="Dashboard">
          Global numbers from /api/stats. Unpriced runs are never counted as $0.
        </PageHeading>
        <OutcomeDonut counts={stats.overall} />
      </div>
      <StatTiles stats={stats} />
      <AgentCards agents={stats.per_agent} />
      <ChartSection id="runs-per-day" title="Runs per day" summary={runsPerDaySummary(stats.runs_per_day)}>
        <RunsPerDayChart days={stats.runs_per_day} />
      </ChartSection>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] gap-4">
        <ChartSection
          id="cost-per-agent"
          title={
            <>
              Cost per agent <span className="font-normal text-dim">(priced runs)</span>
            </>
          }
          summary={costSummary(stats.per_agent)}
        >
          <AgentCostChart agents={stats.per_agent} />
        </ChartSection>
        <ChartSection id="status-per-agent" title="Runs by status per agent" summary={statusSummary(stats.per_agent)}>
          <AgentStatusChart agents={stats.per_agent} />
        </ChartSection>
      </div>
      <DataWarnings warnings={stats.data_warnings} />
    </div>
  );
}
