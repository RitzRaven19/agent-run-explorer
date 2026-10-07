import type { ReactNode } from "react";

type ChartSectionProps = {
  id: string;
  title: string;
  // One sentence with the main takeaway, for people who cannot see the chart.
  summary: string;
  chart: ReactNode;
  // The exact numbers behind the chart, with links, for keyboard and screen reader users.
  table: ReactNode;
};

export default function ChartSection({ id, title, summary, chart, table }: ChartSectionProps) {
  return (
    <section aria-labelledby={id} className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-600">{summary}</p>
      <div className="mt-4">{chart}</div>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-blue-700">Show the numbers</summary>
        <div className="mt-2 max-h-80 overflow-auto">{table}</div>
      </details>
    </section>
  );
}
