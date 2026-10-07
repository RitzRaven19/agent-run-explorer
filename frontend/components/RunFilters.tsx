"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { STATUS_COLORS } from "@/lib/statusColors";
import type { FilterCounts } from "@/lib/filterCounts";
import { activeFilterCount, parseFilters, toSearchParams, type RunFilters as Filters } from "@/lib/filters";
import { AGENT_NAMES, RUN_STATUSES, SORT_FIELDS, TOOL_NAMES, type SortField } from "@/lib/types";

const SEARCH_DEBOUNCE_MS = 300;

const SORT_LABELS: Record<SortField, string> = {
  started_at: "Started at",
  duration_ms: "Duration",
  cost_usd: "Cost",
};

// Adds or removes one value, keeping the list in the same order as `order` so the URL is always written the same way.
function toggled<T extends string>(selected: T[], value: T, order: readonly T[]): T[] {
  const next = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
  return order.filter((item) => next.includes(item));
}

function ChipCount({ count }: { count: number | undefined }) {
  if (count === undefined) return null;
  return <span className="text-[11px] text-dim tabular-nums">{count}</span>;
}

// counts is null when the backend could not be asked; the chips then show no numbers.
export default function RunFilters({ counts }: { counts: FilterCounts | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // The URL is the single source of truth: every control below reads from `filters`.
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  // The one piece of state that is not in the URL: what is currently typed in the search box.
  const [typedQuery, setTypedQuery] = useState(filters.q);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  // Only used below 640px, where the panel starts collapsed; on wider screens CSS keeps it open.
  const [isOpen, setIsOpen] = useState(false);
  const activeCount = activeFilterCount(filters);
  const [seenUrlQuery, setSeenUrlQuery] = useState(filters.q);

  // When something else changes q in the URL (the "Clear filters" link), the box must follow.
  // While the box is focused the user is typing, and a slow response must not overwrite their text.
  if (filters.q !== seenUrlQuery) {
    setSeenUrlQuery(filters.q);
    if (!isSearchFocused) {
      setTypedQuery(filters.q);
    }
  }

  // Any filter change goes back to page 1, because page 3 of the old results means nothing for the new ones.
  const update = useCallback(
    (changes: Partial<Filters>) => {
      const query = toSearchParams({ ...filters, ...changes, page: 1 }).toString();
      // replace, not push: filter tweaks should not fill the Back button's history.
      startTransition(() => router.replace(query ? `/runs?${query}` : "/runs"));
    },
    [filters, router],
  );

  // Wait for a pause in typing, and do nothing when the box already matches the URL (for example on first load).
  // Without that check this would fire on mount and send the user from page 2 back to page 1.
  useEffect(() => {
    const trimmed = typedQuery.trim();
    if (trimmed === filters.q) return;
    const timer = setTimeout(() => update({ q: trimmed }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [typedQuery, filters.q, update]);

  function clearFilters() {
    setTypedQuery("");
    startTransition(() => router.replace("/runs"));
  }

  return (
    <section aria-label="Filters" className="glass flex flex-col gap-[18px] rounded-2xl p-5">
      <button
        type="button"
        className="outline-button flex items-center justify-between sm:hidden"
        aria-expanded={isOpen}
        aria-controls="filter-panel"
        onClick={() => setIsOpen(!isOpen)}
      >
        Filters ({activeCount} active)
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Collapsed behind the button below 640px; from 640px up it is always shown and the button is hidden. */}
      <div id="filter-panel" className={`${isOpen ? "flex" : "hidden sm:flex"} flex-col gap-[18px]`}>
        <div className="flex flex-wrap gap-7">
          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className="mb-2.5 text-xs tracking-[0.1em] text-muted uppercase">Status</legend>
            <div className="flex flex-wrap gap-2">
              {RUN_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  className="chip"
                  aria-pressed={filters.status.includes(status)}
                  onClick={() => update({ status: toggled(filters.status, status, RUN_STATUSES) })}
                >
                  <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full" style={{ background: STATUS_COLORS[status] }} />
                  {status}
                  <ChipCount count={counts?.status[status]} />
                </button>
              ))}
            </div>
          </fieldset>
  
          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className="mb-2.5 text-xs tracking-[0.1em] text-muted uppercase">Agent</legend>
            <div className="flex flex-wrap gap-2">
              {AGENT_NAMES.map((agent) => (
                <button
                  key={agent}
                  type="button"
                  className="chip"
                  aria-pressed={filters.agent.includes(agent)}
                  onClick={() => update({ agent: toggled(filters.agent, agent, AGENT_NAMES) })}
                >
                  {agent}
                  <ChipCount count={counts?.agent[agent]} />
                </button>
              ))}
            </div>
          </fieldset>
  
          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className="mb-2.5 text-xs tracking-[0.1em] text-muted uppercase">Tool used in any step</legend>
            <div className="flex flex-wrap gap-2">
              {TOOL_NAMES.map((tool) => (
                <button
                  key={tool}
                  type="button"
                  className="chip"
                  aria-pressed={filters.tool.includes(tool)}
                  onClick={() => update({ tool: toggled(filters.tool, tool, TOOL_NAMES) })}
                >
                  {tool}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
  
        <div className="flex flex-wrap items-end gap-3.5">
          <div className="flex flex-[1_1_260px] flex-col gap-1.5">
            <label htmlFor="search" className="text-xs text-muted">
              Search prompts
            </label>
            <input
              id="search"
              type="search"
              placeholder="e.g. apology"
              className="field"
              value={typedQuery}
              onChange={(event) => setTypedQuery(event.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </div>
  
          <div className="flex flex-col gap-1.5">
            <label htmlFor="started-from" className="text-xs text-muted">
              Started from
            </label>
            <input
              id="started-from"
              type="date"
              className="field"
              value={filters.started_from}
              max={filters.started_to || undefined}
              onChange={(event) => update({ started_from: event.target.value })}
            />
          </div>
  
          <div className="flex flex-col gap-1.5">
            <label htmlFor="started-to" className="text-xs text-muted">
              Started to
            </label>
            <input
              id="started-to"
              type="date"
              className="field"
              value={filters.started_to}
              min={filters.started_from || undefined}
              onChange={(event) => update({ started_to: event.target.value })}
            />
          </div>
  
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sort" className="text-xs text-muted">
              Sort by
            </label>
            <div className="flex gap-2">
              <select
                id="sort"
                className="field"
                value={filters.sort}
                onChange={(event) => update({ sort: event.target.value as SortField })}
              >
                {SORT_FIELDS.map((field) => (
                  <option key={field} value={field}>
                    {SORT_LABELS[field]}
                  </option>
                ))}
              </select>
              <button type="button" className="outline-button" onClick={() => update({ order: filters.order === "desc" ? "asc" : "desc" })}>
                {filters.order === "desc" ? "Descending ↓" : "Ascending ↑"}
              </button>
            </div>
          </div>
  
          <button type="button" className="outline-button" onClick={clearFilters}>
            Clear filters
          </button>
  
          <span aria-live="polite" className="text-sm text-dim">
            {isPending ? "Updating…" : ""}
          </span>
        </div>
      </div>
    </section>
  );
}
