import { cacheLife } from "next/cache";
import { fetchStats } from "@/lib/api";
import type { StatsResponse } from "@/lib/types";

// The unfiltered stats, kept for a few minutes on the Next.js server. The header pill and the filter counts on /runs
// both need them, and the numbers describe a fixed dataset, so asking the backend again for every page view
// or every filter change would add requests without adding information.
// Lives in its own file because a client component imports lib/api.ts, and this must stay server-side.
export async function getGlobalStats(): Promise<StatsResponse> {
  "use cache";
  cacheLife("minutes");
  return fetchStats();
}
