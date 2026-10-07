export default function RunWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <section role="note" className="rounded-[14px] border border-warn/25 bg-warn/[0.06] px-5 py-4 text-sm text-warn">
      <h2 className="font-medium">⚠ Data warnings for this run</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-[1.8] text-[#f5f3ff]">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </section>
  );
}
