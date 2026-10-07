export default function RunWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <section role="note" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <h2 className="font-semibold">⚠ Data warnings for this run</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </section>
  );
}
