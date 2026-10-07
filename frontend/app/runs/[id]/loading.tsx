// Without this file the parent app/runs/loading.tsx would show the runs-table skeleton while one run loads.
export default function RunLoading() {
  return (
    <div role="status" aria-label="Loading run" className="animate-pulse space-y-4">
      <div className="h-4 w-28 rounded bg-slate-200" />
      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <div className="h-7 w-48 rounded bg-slate-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="h-9 rounded bg-slate-100" />
          ))}
        </div>
        <div className="h-16 rounded bg-slate-100" />
      </div>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-24 rounded-lg border border-slate-200 bg-white" />
      ))}
    </div>
  );
}
