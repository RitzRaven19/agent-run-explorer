export default function RunsTableSkeleton() {
  return (
    <div role="status" aria-label="Loading runs" className="animate-pulse space-y-2">
      <div className="h-5 w-40 rounded bg-slate-200" />
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        {Array.from({ length: 10 }, (_, row) => (
          <div key={row} className="my-3 h-5 rounded bg-slate-200" />
        ))}
      </div>
    </div>
  );
}
