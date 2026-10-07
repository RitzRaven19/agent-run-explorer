import { cacheLife } from "next/cache";
import { fetchHealth, fetchStats } from "@/lib/api";
import type { HealthResponse, StatsResponse } from "@/lib/types";

// The unfiltered stats, kept for a few minutes on the Next.js server. The filter counts on /runs and the duration
// bars both need them, and the numbers describe a fixed dataset, so asking the backend again for every page view
// or every filter change would add requests without adding information.
// Lives in its own file because a client component imports lib/api.ts, and this must stay server-side.
export async function getGlobalStats(): Promise<StatsResponse> {
  "use cache";
  cacheLife("minutes");
  return fetchStats();
}

// The backend's health answer (run count and data warnings) for the header pill, kept the same way.
export async function getHealth(): Promise<HealthResponse> {
  "use cache";
  cacheLife("minutes");
  return fetchHealth();
}
