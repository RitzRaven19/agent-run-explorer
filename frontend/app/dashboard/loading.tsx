export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Loading dashboard" className="animate-pulse space-y-6">
      <div className="h-8 w-40 rounded bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-24 rounded-lg border border-slate-200 bg-white" />
        ))}
      </div>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-80 rounded-lg border border-slate-200 bg-white" />
      ))}
    </div>
  );
}
