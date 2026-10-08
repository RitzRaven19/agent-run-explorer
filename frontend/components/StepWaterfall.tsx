import { formatDurationSeconds, stepAnchorId } from "@/lib/format";
import { buildWaterfall } from "@/lib/waterfall";
import type { Run } from "@/lib/types";

// Narrower label and time columns on a phone, so the bar column keeps enough room for the axis labels.
const WATERFALL_ROW = "grid grid-cols-[96px_minmax(0,1fr)_48px] gap-2 sm:grid-cols-[150px_minmax(0,1fr)_56px] sm:gap-3";

// "Where did the time go?": one bar per step on a shared timeline, each linking to that step's card below.
// Plain <a> links, not next/link: only a real hash navigation updates the :target highlight on the card.
export default function StepWaterfall({ run, failingIndex }: { run: Pick<Run, "started_at" | "steps">; failingIndex: number | null }) {
  const { totalMs, bars } = buildWaterfall(run);
  if (bars.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs tracking-[0.1em] text-dim uppercase">
          Step timeline · where the {formatDurationSeconds(totalMs)} went
        </span>
        <span className="text-xs text-dim">Click a bar to jump to that step</span>
      </div>
      <div className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3.5">
        {bars.map((bar) => {
          const isFailing = bar.index === failingIndex;
          const time = bar.durationMs === null ? "still running" : formatDurationSeconds(bar.durationMs);
          const share = bar.durationMs === null ? "" : ` (${Math.round(bar.widthPercent)}% of the run)`;
          return (
            <a
              key={bar.index}
              href={`#${stepAnchorId(bar.index)}`}
              title={`Step ${bar.index} · ${bar.name} · ${bar.tool} · ${isFailing ? "failed after " : ""}${time}${share}`}
              className={`${WATERFALL_ROW} items-center text-xs max-md:min-h-10`}
            >
              <span className={`truncate ${isFailing ? "text-[#f9a8d4]" : "text-soft"}`}>
                {bar.index} · {bar.name}
              </span>
              <span className="relative h-3.5 rounded bg-white/[0.04]">
                <span
                  className="absolute top-0 bottom-0 min-w-[3px] rounded"
                  style={{
                    left: `${bar.leftPercent}%`,
                    width: `${bar.widthPercent}%`,
                    background: isFailing ? "linear-gradient(90deg, #be185d, #f472b6)" : "linear-gradient(90deg, #7c3aed, #c4b5fd)",
                    boxShadow: isFailing ? "0 0 14px rgba(244,114,182,0.5)" : "0 0 14px rgba(167,139,250,0.4)",
                  }}
                />
              </span>
              <span className={`text-right tabular-nums ${isFailing ? "text-[#f9a8d4]" : "text-muted"}`}>
                {bar.durationMs === null ? "…" : formatDurationSeconds(bar.durationMs)}
                {isFailing && " ✕"}
              </span>
            </a>
          );
        })}
        <div className={`${WATERFALL_ROW} text-xs text-dim tabular-nums`}>
          <span />
          <span className="flex justify-between">
            <span>0 s</span>
            <span>{formatDurationSeconds(totalMs / 2)}</span>
            <span>{formatDurationSeconds(totalMs)}</span>
          </span>
          <span />
        </div>
      </div>
    </div>
  );
}
