import Link from "next/link";
import ErrorPanel from "@/components/ErrorPanel";
import KeyboardRows from "@/components/KeyboardRows";
import RequestIndicator from "@/components/RequestIndicator";
import { CostValue, DurationValue, WarningMark } from "@/components/RunValues";
import StatusBadge from "@/components/StatusBadge";
import { describeError, fetchRunsTimed, type TimedRuns } from "@/lib/api";
import { runDetailHref, runsListHref, type RunFilters } from "@/lib/filters";
import { formatDateTimeUtc, promptPreview } from "@/lib/format";
import type { RunSummary } from "@/lib/types";

const LINK_STYLE = "rounded border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-100";
const DISABLED_STYLE = "rounded border border-slate-200 px-3 py-1 text-sm text-slate-400";

function runsHref(filters: RunFilters, page: number): string {
  return runsListHref({ ...filters, page });
}

function RunRow({ run, filters }: { run: RunSummary; filters: RunFilters }) {
  return (
    // focus-within highlights the whole row while its link has focus (keyboard "selection").
    <tr className="border-t border-slate-100 align-top focus-within:bg-blue-50">
      <td className="whitespace-nowrap px-3 py-2">
        <Link
          href={runDetailHref(run.id, filters)}
          data-run-link
          className="font-mono text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {run.id}
        </Link>{" "}
        {run.warnings.length > 0 && <WarningMark text={run.warnings.join("\n")} />}
      </td>
      <td className="whitespace-nowrap px-3 py-2">{run.agent}</td>
      <td className="px-3 py-2">
        <StatusBadge status={run.status} />
      </td>
      <td className="whitespace-nowrap px-3 py-2">{formatDateTimeUtc(run.started_at)}</td>
      <td className="whitespace-nowrap px-3 py-2 text-right">
        <DurationValue run={run} />
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right font-mono">
        <CostValue costUsd={run.cost_usd} />
      </td>
      <td className="px-3 py-2 text-right">{run.step_count}</td>
      <td className="max-w-xs truncate px-3 py-2 text-slate-600" title={run.prompt}>
        {promptPreview(run.prompt)}
      </td>
    </tr>
  );
}

function Pagination({ filters, lastPage }: { filters: RunFilters; lastPage: number }) {
  const { page } = filters;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between">
      {page > 1 ? (
        <Link href={runsHref(filters, page - 1)} className={LINK_STYLE}>
          Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={DISABLED_STYLE}>
          Previous
        </span>
      )}
      <span className="text-sm text-slate-600">
        Page {page} of {lastPage}
      </span>
      {page < lastPage ? (
        <Link href={runsHref(filters, page + 1)} className={LINK_STYLE}>
          Next
        </Link>
      ) : (
        <span aria-disabled="true" className={DISABLED_STYLE}>
          Next
        </span>
      )}
    </nav>
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
      <div>
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="font-medium">No runs match these filters</p>
          <Link href="/runs" className="mt-2 inline-block text-sm text-blue-700 hover:underline">
            Clear filters
          </Link>
        </div>
        {indicator}
      </div>
    );
  }

  const lastPage = Math.ceil(total / page_size);

  // A hand-typed ?page=99 is past the end: say so instead of printing "Showing 2451–… of 200".
  if (page > lastPage) {
    return (
      <div>
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="font-medium">This page is beyond the results</p>
          <Link href={runsHref(filters, 1)} className="mt-2 inline-block text-sm text-blue-700 hover:underline">
            Go to page 1
          </Link>
        </div>
        {indicator}
      </div>
    );
  }

  const first = (page - 1) * page_size + 1;
  const last = Math.min(page * page_size, total);

  return (
    <div>
      <p className="mb-2 text-sm text-slate-600">
        Showing {first}–{last} of {total}
        <span id="keyboard-hint" className="ml-3 hidden text-xs text-slate-500 md:inline">
          Tip: Tab into the table, then ↑ ↓ to move between runs and Enter to open one.
        </span>
      </p>
      <KeyboardRows hintId="keyboard-hint">
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">Run</th>
                <th className="px-3 py-2">Agent</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Started</th>
                <th className="px-3 py-2 text-right">Duration</th>
                <th className="px-3 py-2 text-right">Cost</th>
                <th className="px-3 py-2 text-right">Steps</th>
                <th className="px-3 py-2">Prompt</th>
              </tr>
            </thead>
            <tbody>
              {items.map((run) => (
                <RunRow key={run.id} run={run} filters={filters} />
              ))}
            </tbody>
          </table>
        </div>
      </KeyboardRows>
      <Pagination filters={filters} lastPage={lastPage} />
      {indicator}
    </div>
  );
}
