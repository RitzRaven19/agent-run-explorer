import Link from "next/link";
import DurationBar from "@/components/DurationBar";
import ErrorPanel from "@/components/ErrorPanel";
import KeyboardRows from "@/components/KeyboardRows";
import RequestIndicator from "@/components/RequestIndicator";
import { CostValue, DurationValue, WarningMark } from "@/components/RunValues";
import StatusBadge from "@/components/StatusBadge";
import { describeError, fetchRunsTimed, type TimedRuns } from "@/lib/api";
import { slowestDurationMs } from "@/lib/durationBar";
import { runDetailHref, runsListHref, type RunFilters } from "@/lib/filters";
import { formatDateTimeUtc, formatDurationSeconds, promptPreview } from "@/lib/format";
import type { RunSummary } from "@/lib/types";

const PAGE_LINK_STYLE = "rounded-[10px] border border-white/[0.14] px-3 py-2";
const PAGE_DISABLED_STYLE = "rounded-[10px] border border-white/[0.06] px-3 py-2 text-faint";

function runsHref(filters: RunFilters, page: number): string {
  return runsListHref({ ...filters, page });
}

function RunRow({ run, filters, slowestMs }: { run: RunSummary; filters: RunFilters; slowestMs: number }) {
  return (
    // focus-within highlights the whole row while its link has focus (keyboard "selection"). A failed run gets a pink edge.
    <tr
      className={`border-t border-white/[0.06] focus-within:bg-white/[0.06] hover:bg-white/[0.035] ${
        run.status === "failed" ? "shadow-[inset_2px_0_0_rgba(244,114,182,0.7)]" : ""
      }`}
    >
      <td className="px-[18px] py-3.5 font-mono text-[13px] whitespace-nowrap">
        <Link href={runDetailHref(run.id, filters)} data-run-link className="text-white">
          {run.id}
        </Link>
        {run.warnings.length > 0 && (
          <span className="ml-1.5">
            <WarningMark text={run.warnings.join("\n")} />
          </span>
        )}
      </td>
      <td className="px-3 py-3.5 whitespace-nowrap text-soft">{run.agent}</td>
      <td className="px-3 py-3.5">
        <StatusBadge status={run.status} />
      </td>
      <td className="px-3 py-3.5 whitespace-nowrap text-muted tabular-nums">{formatDateTimeUtc(run.started_at)}</td>
      <td className="px-3 py-3.5 text-right font-mono text-[13px] whitespace-nowrap">
        <div className="flex flex-col items-end gap-[5px]">
          <DurationValue run={run} />
          <DurationBar run={run} slowestMs={slowestMs} />
        </div>
      </td>
      <td className="px-3 py-3.5 text-right font-mono text-[13px] whitespace-nowrap">
        <CostValue costUsd={run.cost_usd} />
      </td>
      <td className="px-3 py-3.5 text-right text-muted tabular-nums">{run.step_count}</td>
      <td className="max-w-[340px] truncate px-[18px] py-3.5 text-muted" title={run.prompt}>
        {promptPreview(run.prompt)}
      </td>
    </tr>
  );
}

function Pagination({ filters, lastPage }: { filters: RunFilters; lastPage: number }) {
  const { page } = filters;
  return (
    <nav aria-label="Pagination" className="flex items-center gap-2 text-[13px] text-muted">
      {page > 1 ? (
        <Link href={runsHref(filters, page - 1)} className={PAGE_LINK_STYLE}>
          ← Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={PAGE_DISABLED_STYLE}>
          ← Previous
        </span>
      )}
      <span>
        Page {page} of {lastPage}
      </span>
      {page < lastPage ? (
        <Link href={runsHref(filters, page + 1)} className={PAGE_LINK_STYLE}>
          Next →
        </Link>
      ) : (
        <span aria-disabled="true" className={PAGE_DISABLED_STYLE}>
          Next →
        </span>
      )}
    </nav>
  );
}

function EmptyState({ message, href, linkLabel }: { message: string; href: string; linkLabel: string }) {
  return (
    <div className="glass flex flex-col items-center gap-3 rounded-2xl px-6 py-12 text-center">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.6" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <p className="text-ink">{message}</p>
      <Link href={href} className="outline-button inline-flex items-center">
        {linkLabel}
      </Link>
    </div>
  );
}

export default async function RunsResults({ filters }: { filters: RunFilters }) {
  let result: TimedRuns;
  try {
    result = await fetchRunsTimed(filters);
  } catch (error) {
    return <ErrorPanel message={describeError(error)} />;
  }
  const indicator = <RequestIndicator requestId={result.requestId} durationMs={result.durationMs} />;
  const { items, total, page, page_size } = result.list;

  if (total === 0) {
    return (
      <div className="flex flex-col gap-3">
        <EmptyState message="No runs match these filters" href="/runs" linkLabel="Clear filters" />
        {indicator}
      </div>
    );
  }

  const lastPage = Math.ceil(total / page_size);

  // A hand-typed ?page=99 is past the end: say so instead of printing "Showing 2451–… of 200".
  if (page > lastPage) {
    return (
      <div className="flex flex-col gap-3">
        <EmptyState message="This page is beyond the results" href={runsHref(filters, 1)} linkLabel="Go to page 1" />
        {indicator}
      </div>
    );
  }

  const first = (page - 1) * page_size + 1;
  const last = Math.min(page * page_size, total);
  const slowestMs = slowestDurationMs(items);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between gap-2 text-[13px] text-muted">
        <span>
          Showing{" "}
          <strong className="font-medium text-ink">
            {first}–{last}
          </strong>{" "}
          of {total}
        </span>
        <span id="keyboard-hint" className="hidden md:inline">
          Tip: ↑ ↓ to move between runs, Enter to open
        </span>
      </div>
      <KeyboardRows hintId="keyboard-hint">
        <div className="glass overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-white/[0.025] text-[11px] tracking-[0.1em] text-muted uppercase">
                  <th className="px-[18px] py-3.5 font-medium">Run</th>
                  <th className="px-3 py-3.5 font-medium">Agent</th>
                  <th className="px-3 py-3.5 font-medium">Status</th>
                  <th className="px-3 py-3.5 font-medium">Started</th>
                  <th
                    className="px-3 py-3.5 text-right font-medium"
                    title={`Bar = duration relative to the slowest run on this page (${formatDurationSeconds(slowestMs)})`}
                  >
                    Duration
                  </th>
                  <th className="px-3 py-3.5 text-right font-medium">Cost</th>
                  <th className="px-3 py-3.5 text-right font-medium">Steps</th>
                  <th className="px-[18px] py-3.5 font-medium">Prompt</th>
                </tr>
              </thead>
              <tbody>
                {items.map((run) => (
                  <RunRow key={run.id} run={run} filters={filters} slowestMs={slowestMs} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </KeyboardRows>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {indicator}
        <Pagination filters={filters} lastPage={lastPage} />
      </div>
    </div>
  );
}
