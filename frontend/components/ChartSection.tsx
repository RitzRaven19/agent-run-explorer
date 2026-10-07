import type { ReactNode } from "react";

type ChartSectionProps = {
  id: string;
  title: ReactNode;
  // One sentence with the main takeaway, for people who cannot see the chart.
  summary: string;
  children: ReactNode;
};

export default function ChartSection({ id, title, summary, children }: ChartSectionProps) {
  return (
    <section aria-labelledby={id} className="glass flex flex-col gap-4 rounded-[18px] p-6">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-lg font-semibold">
          {title}
        </h2>
        <p className="text-[13px] text-muted">{summary}</p>
      </div>
      {children}
    </section>
  );
}
