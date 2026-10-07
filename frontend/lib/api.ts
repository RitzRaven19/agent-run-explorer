import { DEFAULT_FILTERS, toSearchParams, type RunFilters } from "@/lib/filters";
import type { Run, RunListResponse, StatsResponse } from "@/lib/types";

// API_URL is only set on the server; NEXT_PUBLIC_API_URL is the one a browser can see.
function apiBaseUrl(): string {
  const url = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("Set API_URL (and NEXT_PUBLIC_API_URL) to the backend address, e.g. http://localhost:8000");
  }
  return url.replace(/\/$/, "");
}

// FastAPI sends detail as a string for our own errors and as a list of {msg} objects for validation errors.
async function readDetail(response: Response): Promise<string> {
  try {
    const body: { detail?: string | { msg: string }[] } = await response.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) return body.detail.map((item) => item.msg).join("; ");
  } catch {
    // The body was not JSON; the status code alone has to do.
  }
  return response.statusText;
}

async function request(path: string): Promise<Response> {
  const baseUrl = apiBaseUrl();
  try {
    // no-store: the list changes with every filter, so Next must never reuse an earlier answer.
    return await fetch(`${baseUrl}${path}`, { cache: "no-store" });
  } catch {
    throw new Error(`Could not reach the backend at ${baseUrl}`);
  }
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

// Returns null for an unknown id so the page can call notFound().
export async function fetchRun(id: string): Promise<Run | null> {
  const response = await request(`/api/runs/${encodeURIComponent(id)}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Backend error ${response.status}: ${await readDetail(response)}`);
  }
  return response.json();
}

// Stats take the same filters as the list, but sort and paging mean nothing to them, so those are reset.
export function fetchStats(filters: RunFilters = DEFAULT_FILTERS): Promise<StatsResponse> {
  const { status, agent, q, started_from, started_to } = filters;
  const filtersOnly: RunFilters = { ...DEFAULT_FILTERS, status, agent, q, started_from, started_to };
  return getJson<StatsResponse>(`/api/stats?${toSearchParams(filtersOnly)}`);
}
