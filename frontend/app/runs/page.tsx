import { Suspense } from "react";
import RunsResults from "@/components/RunsResults";
import RunsTableSkeleton from "@/components/RunsTableSkeleton";
import { parseFilters, toSearchParams } from "@/lib/filters";

export default async function RunsPage({ searchParams }: PageProps<"/runs">) {
  // searchParams is a Promise in this Next.js version, so it has to be awaited.
  const filters = parseFilters(await searchParams);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Runs</h1>
      {/* The key changes with every filter, so React shows the skeleton again instead of keeping the old table. */}
      <Suspense key={toSearchParams(filters).toString()} fallback={<RunsTableSkeleton />}>
        <RunsResults filters={filters} />
      </Suspense>
    </div>
  );
}
