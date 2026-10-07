import Link from "next/link";
import ErrorPanel from "@/components/ErrorPanel";
import StatusBadge from "@/components/StatusBadge";
import { describeError, fetchRuns } from "@/lib/api";
import { toSearchParams, type RunFilters } from "@/lib/filters";
import {
  formatCost,
  formatDateTimeUtc,
  formatDurationSeconds,
  hasInvalidDuration,
  promptPreview,
} from "@/lib/format";
import type { RunListResponse, RunSummary } from "@/lib/types";

const LINK_STYLE = "rounded border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-100";
const DISABLED_STYLE = "rounded border border-slate-200 px-3 py-1 text-sm text-slate-400";

function runsHref(filters: RunFilters, page: number): string {
  const query = toSearchParams({ ...filters, page }).toString();
  return query ? `/runs?${query}` : "/runs";
}

function WarningMark({ text }: { text: string }) {
  return (
    <span title={text} aria-label={`Warning: ${text}`} className="cursor-help text-amber-600">
      ⚠
    </span>
  );
}

function DurationCell({ run }: { run: RunSummary }) {
  if (run.status === "running") return <span className="text-blue-700">running</span>;
  if (hasInvalidDuration(run)) {
    return (
      <span>
        — <WarningMark text="Invalid duration: the run ended before it started" />
      </span>
    );
  }
  if (run.duration_ms === null) return <span>—</span>;
  return <span>{formatDurationSeconds(run.duration_ms)}</span>;
}

function CostCell({ costUsd }: { costUsd: number | null }) {
  if (costUsd === null) {
    return <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">unpriced</span>;
  }
  return <span>{formatCost(costUsd)}</span>;
}

function RunRow({ run }: { run: RunSummary }) {
  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="whitespace-nowrap px-3 py-2">
        <Link href={`/runs/${run.id}`} className="font-mono text-blue-700 hover:underline">
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
        <DurationCell run={run} />
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right font-mono">
        <CostCell costUsd={run.cost_usd} />
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
  let list: RunListResponse;
  try {
    list = await fetchRuns(filters);
  } catch (error) {
    return <ErrorPanel message={describeError(error)} />;
  }
  const { items, total, page, page_size } = list;

  if (total === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="font-medium">No runs match these filters</p>
        <Link href="/runs" className="mt-2 inline-block text-sm text-blue-700 hover:underline">
          Clear filters
        </Link>
      </div>
    );
  }

  const lastPage = Math.ceil(total / page_size);

  // A hand-typed ?page=99 is past the end: say so instead of printing "Showing 2451–… of 200".
  if (page > lastPage) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="font-medium">This page is beyond the results</p>
        <Link href={runsHref(filters, 1)} className="mt-2 inline-block text-sm text-blue-700 hover:underline">
          Go to page 1
        </Link>
      </div>
    );
  }

  const first = (page - 1) * page_size + 1;
  const last = Math.min(page * page_size, total);

  return (
    <div>
      <p className="mb-2 text-sm text-slate-600">
        Showing {first}–{last} of {total}
      </p>
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
              <RunRow key={run.id} run={run} />
            ))}
          </tbody>
        </table>
      </div>
      <Pagination filters={filters} lastPage={lastPage} />
    </div>
  );
}
