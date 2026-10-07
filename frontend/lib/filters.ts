import {
  AGENT_NAMES,
  RUN_STATUSES,
  SORT_FIELDS,
  SORT_ORDERS,
  TOOL_NAMES,
  type AgentName,
  type RunStatus,
  type SortField,
  type SortOrder,
  type ToolName,
} from "@/lib/types";

// Everything the /runs page can be told to show. The URL is the only place this state lives.
export type RunFilters = {
  status: RunStatus[];
  agent: AgentName[];
  tool: ToolName[]; // runs where any step used one of these tools
  q: string;
  started_from: string; // YYYY-MM-DD, or "" for no lower bound
  started_to: string; // YYYY-MM-DD, or "" for no upper bound
  sort: SortField;
  order: SortOrder;
  page: number;
  page_size: number;
};

export const DEFAULT_FILTERS: RunFilters = {
  status: [],
  agent: [],
  tool: [],
  q: "",
  started_from: "",
  started_to: "",
  sort: "started_at",
  order: "desc",
  page: 1,
  page_size: 25,
};

// Next's page props give a plain object; useSearchParams() gives a URLSearchParams. Accept both.
export type SearchParamsInput = URLSearchParams | Record<string, string | string[] | undefined>;

function getAll(input: SearchParamsInput, key: string): string[] {
  if (input instanceof URLSearchParams) {
    return input.getAll(key);
  }
  const value = input[key];
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function getOne(input: SearchParamsInput, key: string): string | undefined {
  return getAll(input, key)[0];
}

// Keeps only the allowed values, once each, in the allowed list's order, so the URL is always written the same way.
function pickAllowed<T extends string>(values: string[], allowed: readonly T[]): T[] {
  return allowed.filter((option) => values.includes(option));
}

function pickOne<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.find((option) => option === value) ?? fallback;
}

// Rejects things like 2026-02-31, which match the pattern but are not real days (the backend would answer 422).
function parseDate(value: string | undefined): string {
  if (value === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "";
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDay =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return isRealDay ? value : "";
}

function parsePositiveInt(value: string | undefined, fallback: number, max: number): number {
  if (value === undefined || !/^\d+$/.test(value)) {
    return fallback;
  }
  const number = Number(value);
  return number >= 1 && number <= max ? number : fallback;
}

export function parseFilters(input: SearchParamsInput): RunFilters {
  let startedFrom = parseDate(getOne(input, "started_from"));
  let startedTo = parseDate(getOne(input, "started_to"));
  // YYYY-MM-DD strings compare correctly as text. A reversed range would make the backend answer 422, so drop it.
  if (startedFrom && startedTo && startedFrom > startedTo) {
    startedFrom = "";
    startedTo = "";
  }

  return {
    status: pickAllowed(getAll(input, "status"), RUN_STATUSES),
    agent: pickAllowed(getAll(input, "agent"), AGENT_NAMES),
    tool: pickAllowed(getAll(input, "tool"), TOOL_NAMES),
    q: (getOne(input, "q") ?? "").trim(),
    started_from: startedFrom,
    started_to: startedTo,
    sort: pickOne(getOne(input, "sort"), SORT_FIELDS, DEFAULT_FILTERS.sort),
    order: pickOne(getOne(input, "order"), SORT_ORDERS, DEFAULT_FILTERS.order),
    page: parsePositiveInt(getOne(input, "page"), DEFAULT_FILTERS.page, Number.MAX_SAFE_INTEGER),
    page_size: parsePositiveInt(getOne(input, "page_size"), DEFAULT_FILTERS.page_size, 100),
  };
}

// Writes only what differs from the defaults, so the URL stays short and /runs means "the default view".
export function toSearchParams(filters: RunFilters): URLSearchParams {
  const params = new URLSearchParams();
  filters.status.forEach((status) => params.append("status", status));
  filters.agent.forEach((agent) => params.append("agent", agent));
  filters.tool.forEach((tool) => params.append("tool", tool));
  if (filters.q) params.set("q", filters.q);
  if (filters.started_from) params.set("started_from", filters.started_from);
  if (filters.started_to) params.set("started_to", filters.started_to);
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set("sort", filters.sort);
  if (filters.order !== DEFAULT_FILTERS.order) params.set("order", filters.order);
  if (filters.page !== DEFAULT_FILTERS.page) params.set("page", String(filters.page));
  if (filters.page_size !== DEFAULT_FILTERS.page_size) params.set("page_size", String(filters.page_size));
  return params;
}

export function runsListHref(filters: RunFilters): string {
  const query = toSearchParams(filters).toString();
  return query ? `/runs?${query}` : "/runs";
}

// The backend compares whole days, so from = to = the same day lists exactly that day's runs.
export function runsForDayHref(isoDate: string): string {
  return runsListHref({ ...DEFAULT_FILTERS, started_from: isoDate, started_to: isoDate });
}

export function runsForAgentHref(agent: AgentName): string {
  return runsListHref({ ...DEFAULT_FILTERS, agent: [agent] });
}

export type QuickPreset = { label: string; filters: RunFilters };

// Each preset is a whole filter set, not a change on top of the current one, so clicking it replaces every filter.
export const QUICK_PRESETS: QuickPreset[] = [
  { label: "Failures", filters: { ...DEFAULT_FILTERS, status: ["failed"] } },
  { label: "Slowest", filters: { ...DEFAULT_FILTERS, sort: "duration_ms", order: "desc" } },
  { label: "Most expensive", filters: { ...DEFAULT_FILTERS, sort: "cost_usd", order: "desc" } },
  { label: "Running now", filters: { ...DEFAULT_FILTERS, status: ["running"] } },
];

// Page is ignored so a preset stays highlighted while you page through its results.
export function isPresetActive(preset: QuickPreset, current: RunFilters): boolean {
  return (
    toSearchParams({ ...current, page: 1 }).toString() === toSearchParams(preset.filters).toString()
  );
}

// The list's query string travels to the run page as ?from=, so "Back to runs" can restore the same view.
export function runDetailHref(runId: string, filters: RunFilters): string {
  const path = `/runs/${encodeURIComponent(runId)}`;
  const listQuery = toSearchParams(filters).toString();
  return listQuery ? `${path}?${new URLSearchParams({ from: listQuery })}` : path;
}

// ?from= comes from the URL, so anyone can put anything in it. It is parsed and rebuilt rather than used as-is:
// only known filters survive and the link always points at /runs, so it can never send the user to another site.
export function backToRunsHref(from: string | undefined): string {
  return runsListHref(parseFilters(new URLSearchParams(from ?? "")));
}
