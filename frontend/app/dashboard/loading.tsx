export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Loading dashboard" className="flex animate-pulse flex-col gap-6 pt-12 pb-[72px]">
      <div className="h-24 w-72 rounded bg-white/10" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="glass h-32 rounded-2xl" />
        ))}
      </div>
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className="glass h-64 rounded-[18px]" />
      ))}
    </div>
  );
}
