// Without this file the parent app/runs/loading.tsx would show the runs-table skeleton while one run loads.
export default function RunLoading() {
  return (
    <div role="status" aria-label="Loading run" className="flex animate-pulse flex-col gap-[22px] pt-10 pb-[72px]">
      <div className="h-4 w-28 rounded bg-white/10" />
      <div className="glass flex flex-col gap-4 rounded-[18px] p-[26px]">
        <div className="h-7 w-48 rounded bg-white/10" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="h-9 rounded bg-white/[0.06]" />
          ))}
        </div>
        <div className="h-16 rounded bg-white/[0.06]" />
      </div>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="glass h-24 rounded-[14px]" />
      ))}
    </div>
  );
}
