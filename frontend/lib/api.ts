import { DEFAULT_FILTERS, toSearchParams, type RunFilters } from "@/lib/filters";
import type { HealthResponse, Run, RunListResponse, StatsResponse } from "@/lib/types";

// API_URL is only set on the server; NEXT_PUBLIC_API_URL is the one a browser can see.
export function apiBaseUrl(): string {
  const url = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("Set API_URL (and NEXT_PUBLIC_API_URL) to the backend address, e.g. http://localhost:8000");
  }
  return url.replace(/\/$/, "");
}

// FastAPI sends detail as a string for our own errors and as a list of {msg} objects for validation errors.
export async function readDetail(response: Response): Promise<string> {
  try {
    const body: { detail?: string | { msg: string }[] } = await response.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) return body.detail.map((item) => item.msg).join("; ");
  } catch {
    // The body was not JSON; the status code alone has to do.
  }
  return response.statusText;
}

// Vercel gives a function minutes on the Hobby plan (checked in its docs, with Fluid compute on). Giving up well before
// that means a sleeping free-tier backend shows our own "waking up" message instead of a hung page or a platform 504.
const BACKEND_TIMEOUT_MS = 25_000;

const WAKING_UP_HINT = "free hosting sleeps when idle. Try again in ~30 s.";

// Turns a failed fetch (the backend never answered) into text a person can act on. A timeout is the usual sign of a
// sleeping free-tier backend; any other failure may be the same thing or a wrong address.
export function fetchFailureMessage(error: unknown, baseUrl: string): string {
  if (error instanceof Error && error.name === "TimeoutError") {
    return `The backend is waking up — ${WAKING_UP_HINT}`;
  }
  return `Could not reach the backend at ${baseUrl}. It may be waking up — ${WAKING_UP_HINT}`;
}

async function request(path: string): Promise<Response> {
  const baseUrl = apiBaseUrl();
  try {
    // no-store: the list changes with every filter, so Next must never reuse an earlier answer.
    return await fetch(`${baseUrl}${path}`, { cache: "no-store", signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS) });
  } catch (error) {
    throw new Error(fetchFailureMessage(error, baseUrl));
  }
}

// Server components catch backend errors and show this text, because Next.js hides the message of
// an error that reaches error.tsx in production builds.
export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : "Something unexpected went wrong";
}

async function getJson<T>(path: string): Promise<T> {
  const response = await request(path);
  if (!response.ok) {
    throw new Error(`Backend error ${response.status}: ${await readDetail(response)}`);
  }
  return response.json();
}

// The backend's defaults for sort, order, page and page_size match DEFAULT_FILTERS,
// so the compact query string from toSearchParams means the same thing to the backend.
export function fetchRuns(filters: RunFilters): Promise<RunListResponse> {
  return getJson<RunListResponse>(`/api/runs?${toSearchParams(filters)}`);
}

export type TimedRuns = { list: RunListResponse; durationMs: number; requestId: string };

// The list plus how long the backend request took and a fresh id for it. Timed here because the Next.js server is
// what calls the backend; the browser never sees that request. The id lets the browser-side counter tell requests apart.
export async function fetchRunsTimed(filters: RunFilters): Promise<TimedRuns> {
  const startedAt = performance.now();
  const list = await fetchRuns(filters);
  return { list, durationMs: performance.now() - startedAt, requestId: crypto.randomUUID() };
}

// Returns null for an unknown id so the page can call notFound().
export async function fetchRun(id: string): Promise<Run | null> {
  const response = await request(`/api/runs/${encodeURIComponent(id)}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Backend error ${response.status}: ${await readDetail(response)}`);
  }
  return response.json();
}

// Called from the browser, so it resolves to NEXT_PUBLIC_API_URL there.
export function explainUrl(runId: string): string {
  return `${apiBaseUrl()}/api/runs/${encodeURIComponent(runId)}/explain`;
}

export function fetchHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>("/api/health");
}

// Stats take the same filters as the list, but sort and paging mean nothing to them, so those are reset.
export function fetchStats(filters: RunFilters = DEFAULT_FILTERS): Promise<StatsResponse> {
  const { status, agent, tool, q, started_from, started_to } = filters;
  const filtersOnly: RunFilters = { ...DEFAULT_FILTERS, status, agent, tool, q, started_from, started_to };
  return getJson<StatsResponse>(`/api/stats?${toSearchParams(filtersOnly)}`);
}
