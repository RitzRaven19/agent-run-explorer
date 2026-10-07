import { Suspense } from "react";
import PageHeading from "@/components/PageHeading";
import QuickInvestigations from "@/components/QuickInvestigations";
import RunFilters from "@/components/RunFilters";
import RunsResults from "@/components/RunsResults";
import RunsTableSkeleton from "@/components/RunsTableSkeleton";
import { toFilterCounts, type FilterCounts } from "@/lib/filterCounts";
import { parseFilters, toSearchParams } from "@/lib/filters";
import { getGlobalStats } from "@/lib/globalStats";

// The numbers on the chips are a nicety: if the backend cannot be asked, the list itself still reports the error.
async function loadFilterCounts(): Promise<FilterCounts | null> {
  try {
    return toFilterCounts(await getGlobalStats());
  } catch {
    return null;
  }
}

export default async function RunsPage({ searchParams }: PageProps<"/runs">) {
  // searchParams is a Promise in this Next.js version, so it has to be awaited.
  const filters = parseFilters(await searchParams);
  const counts = await loadFilterCounts();

  return (
    <div className="flex flex-col gap-6 pt-14 pb-16">
      <PageHeading eyebrow="Agent traces" title="Agent Runs">
        Browse every run, filter by status, agent and tool, and open a run to read its steps.
      </PageHeading>
      <QuickInvestigations />
      <RunFilters counts={counts} />
      {/* The key changes with every filter, so React shows the skeleton again instead of keeping the old table. */}
      <Suspense key={toSearchParams(filters).toString()} fallback={<RunsTableSkeleton />}>
        <RunsResults filters={filters} />
      </Suspense>
    </div>
  );
}
