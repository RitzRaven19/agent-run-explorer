import Link from "next/link";
import { axisLabels, dayAxisTicks, dayBars } from "@/lib/dashboard";
import { runsForDayHref } from "@/lib/filters";
import type { DayCount } from "@/lib/types";

// One bar per day, each a link to that day's runs. Plain HTML and CSS, so there is no chart library to load.
// The y-axis and grid lines are decoration (the summary above the chart and each bar's label carry the numbers).
export default function RunsPerDayChart({ days }: { days: DayCount[] }) {
  const labels = axisLabels(days);
  const ticks = dayAxisTicks(days);

  return (
    <div className="scroll-px-2 overflow-x-auto">
      <div className="flex min-w-[760px] pr-1.5">
        <div aria-hidden="true" className="relative h-[200px] w-8 shrink-0 text-xs text-dim">
          {ticks.map((tick) => (
            <span
              key={tick.value}
              className="absolute right-2 leading-none tabular-nums"
              style={{ bottom: `${tick.heightPx - 6}px` }}
            >
              {tick.value}
            </span>
          ))}
        </div>
        <div className="flex-1">
          <div className="relative h-[200px] border-b border-white/[0.12]">
            {ticks
              .filter((tick) => tick.value > 0)
              .map((tick) => (
                <div
                  key={tick.value}
                  aria-hidden="true"
                  className="absolute inset-x-0 border-t border-[rgba(167,139,250,0.1)]"
                  style={{ bottom: `${tick.heightPx}px` }}
                />
              ))}
            <div className="absolute inset-0 flex items-end gap-[5px]">
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
          </div>
          <div className="flex justify-between pt-2 text-xs text-dim">
            {labels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
