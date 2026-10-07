export default function RunsTableSkeleton() {
  return (
    <div role="status" aria-label="Loading runs" className="animate-pulse space-y-3">
      <div className="h-5 w-40 rounded bg-white/10" />
      <div className="glass rounded-2xl p-4">
        {Array.from({ length: 10 }, (_, row) => (
          <div key={row} className="my-3 h-5 rounded bg-white/10" />
        ))}
      </div>
    </div>
  );
}
