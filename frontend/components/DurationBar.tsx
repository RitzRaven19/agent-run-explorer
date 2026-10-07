import type { CSSProperties } from "react";
import { durationBarPercent } from "@/lib/durationBar";
import { formatDurationSeconds, hasInvalidDuration } from "@/lib/format";
import type { RunBase } from "@/lib/types";

type Props = { run: Pick<RunBase, "status" | "duration_ms">; slowestMs: number };

// A thin bar under the duration, filled in proportion to the slowest run on the page.
// Running and invalid durations get their own look, so they are never mistaken for a real, short run.
export default function DurationBar({ run, slowestMs }: Props) {
  let fill: CSSProperties | null = null;
  let title = "No duration recorded";

  if (run.status === "running") {
    fill = { width: "35%", background: "linear-gradient(90deg, transparent, #818cf8, transparent)" };
    title = "Still running: no duration yet";
  } else if (hasInvalidDuration(run)) {
    fill = {
      width: "100%",
      background: "repeating-linear-gradient(90deg, rgba(233,213,255,0.5) 0 4px, transparent 4px 8px)",
    };
    title = `Invalid duration (${run.duration_ms} ms): excluded from median and p95`;
  } else if (run.duration_ms !== null) {
    const percent = durationBarPercent(run.duration_ms, slowestMs);
    fill = { width: `${percent}%`, background: "linear-gradient(90deg, #7c3aed, #c4b5fd)" };
    title = `${percent}% of the slowest run on this page (${formatDurationSeconds(slowestMs)})`;
  }

  return (
    <span title={title} className="block h-[3px] w-[72px] overflow-hidden rounded-[3px] bg-white/[0.07]">
      {fill && <span className="block h-full" style={fill} />}
    </span>
  );
}
