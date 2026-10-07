import { Suspense } from "react";
import ErrorPanel from "@/components/ErrorPanel";
import RunFilters from "@/components/RunFilters";
import RunsResults from "@/components/RunsResults";
import RunsTableSkeleton from "@/components/RunsTableSkeleton";
import { describeError, fetchStats } from "@/lib/api";
import { parseFilters, toSearchParams } from "@/lib/filters";
import type { StatsResponse } from "@/lib/types";

export default async function RunsPage({ searchParams }: PageProps<"/runs">) {
  // searchParams is a Promise in this Next.js version, so it has to be awaited.
  const filters = parseFilters(await searchParams);

  // Unfiltered on purpose: the agent checkboxes must keep listing every agent while a filter is active.
  let stats: StatsResponse;
  try {
    stats = await fetchStats();
  } catch (error) {
    return <ErrorPanel message={describeError(error)} />;
  }
  const agents = stats.per_agent.map((agentStats) => agentStats.agent);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Runs</h1>
      <RunFilters agents={agents} />
      {/* The key changes with every filter, so React shows the skeleton again instead of keeping the old table. */}
      <Suspense key={toSearchParams(filters).toString()} fallback={<RunsTableSkeleton />}>
        <RunsResults filters={filters} />
      </Suspense>
    </div>
  );
}
