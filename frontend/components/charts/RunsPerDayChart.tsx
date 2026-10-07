import Link from "next/link";
import { axisLabels, dayBars } from "@/lib/dashboard";
import { runsForDayHref } from "@/lib/filters";
import type { DayCount } from "@/lib/types";

// One bar per day, each a link to that day's runs. Plain HTML and CSS, so there is no chart library to load.
export default function RunsPerDayChart({ days }: { days: DayCount[] }) {
  const labels = axisLabels(days);

  return (
    <div className="overflow-x-auto">
      <div
        className="flex h-[220px] min-w-[760px] items-end gap-[5px] border-b border-white/[0.12] pt-2.5"
        style={{ backgroundImage: "linear-gradient(rgba(167,139,250,0.08) 1px, transparent 1px)", backgroundSize: "100% 55px" }}
      >
        {days.length === 0 && <p className="m-auto self-center text-sm text-dim">No runs to show.</p>}
        {dayBars(days).map((bar) => (
          <Link
            key={bar.date}
            href={runsForDayHref(bar.date)}
            title={`${bar.label}: ${bar.count} ${bar.count === 1 ? "run" : "runs"}`}
            aria-label={`${bar.label}: ${bar.count} ${bar.count === 1 ? "run" : "runs"}`}
            className="bar flex-1 basis-0 rounded-t"
            style={{
              height: `${bar.heightPx}px`,
              background: bar.isPeak
                ? "linear-gradient(180deg, #ede9fe, #7c3aed)"
                : "linear-gradient(180deg, rgba(167,139,250,0.85), rgba(76,29,149,0.25))",
              boxShadow: bar.isPeak ? "0 0 20px rgba(139,92,246,0.7)" : undefined,
            }}
          />
        ))}
      </div>
      <div className="flex min-w-[760px] justify-between pt-2 text-[11px] text-dim">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}
