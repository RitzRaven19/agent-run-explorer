"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { parseFilters, toSearchParams, type RunFilters as Filters } from "@/lib/filters";
import { AGENT_NAMES, RUN_STATUSES, SORT_FIELDS, TOOL_NAMES, type SortField } from "@/lib/types";

const SEARCH_DEBOUNCE_MS = 300;

const SORT_LABELS: Record<SortField, string> = {
  started_at: "Started at",
  duration_ms: "Duration",
  cost_usd: "Cost",
};

const INPUT_STYLE = "rounded border border-slate-300 bg-white px-2 py-1 text-sm";

// Adds or removes one value, keeping the list in the same order as `order` so the URL is always written the same way.
function toggled<T extends string>(selected: T[], value: T, order: readonly T[]): T[] {
  const next = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
  return order.filter((item) => next.includes(item));
}

export default function RunFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // The URL is the single source of truth: every control below reads from `filters`.
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  // The one piece of state that is not in the URL: what is currently typed in the search box.
  const [typedQuery, setTypedQuery] = useState(filters.q);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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
    <section aria-label="Filters" className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap gap-x-8 gap-y-4">
        <fieldset>
          <legend className="mb-1 text-sm font-medium">Status</legend>
          <div className="flex flex-wrap gap-3">
            {RUN_STATUSES.map((status) => (
              <label key={status} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={filters.status.includes(status)}
                  onChange={() => update({ status: toggled(filters.status, status, RUN_STATUSES) })}
                />
                {status}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-sm font-medium">Agent</legend>
          <div className="flex flex-wrap gap-3">
            {AGENT_NAMES.map((agent) => (
              <label key={agent} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={filters.agent.includes(agent)}
                  onChange={() => update({ agent: toggled(filters.agent, agent, AGENT_NAMES) })}
                />
                {agent}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-sm font-medium">Tool used in any step</legend>
          <div className="flex flex-wrap gap-2">
            {TOOL_NAMES.map((tool) => {
              const isSelected = filters.tool.includes(tool);
              return (
                <button
                  key={tool}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => update({ tool: toggled(filters.tool, tool, TOOL_NAMES) })}
                  className={`rounded-full border px-3 py-0.5 font-mono text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                    isSelected
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {tool}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="started-from" className="text-sm font-medium">
            Started from
          </label>
          <input
            id="started-from"
            type="date"
            className={INPUT_STYLE}
            value={filters.started_from}
            max={filters.started_to || undefined}
            onChange={(event) => update({ started_from: event.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="started-to" className="text-sm font-medium">
            Started to
          </label>
          <input
            id="started-to"
            type="date"
            className={INPUT_STYLE}
            value={filters.started_to}
            min={filters.started_from || undefined}
            onChange={(event) => update({ started_to: event.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="search" className="text-sm font-medium">
            Search prompts
          </label>
          <input
            id="search"
            type="search"
            className={INPUT_STYLE}
            value={typedQuery}
            onChange={(event) => setTypedQuery(event.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="sort" className="text-sm font-medium">
            Sort by
          </label>
          <div className="flex gap-2">
            <select
              id="sort"
              className={INPUT_STYLE}
              value={filters.sort}
              onChange={(event) => update({ sort: event.target.value as SortField })}
            >
              {SORT_FIELDS.map((field) => (
                <option key={field} value={field}>
                  {SORT_LABELS[field]}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={`${INPUT_STYLE} hover:bg-slate-100`}
              onClick={() => update({ order: filters.order === "desc" ? "asc" : "desc" })}
            >
              {filters.order === "desc" ? "Descending ↓" : "Ascending ↑"}
            </button>
          </div>
        </div>

        <button type="button" className={`${INPUT_STYLE} hover:bg-slate-100`} onClick={clearFilters}>
          Clear filters
        </button>

        <span aria-live="polite" className="text-sm text-slate-500">
          {isPending ? "Updating…" : ""}
        </span>
      </div>
    </section>
  );
}
