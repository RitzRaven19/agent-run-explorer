import Link from "next/link";
import { donutGradient, finishedCount } from "@/lib/dashboard";
import { formatPercent } from "@/lib/format";
import { STATUS_COLORS } from "@/lib/statusColors";
import type { StatusCounts } from "@/lib/types";

// The success rate as a ring: how the finished runs split into succeeded, failed and cancelled. Running runs have no
// outcome yet, so they are listed beside the ring instead of being part of it. Clicking opens the runs list.
export default function OutcomeDonut({ counts }: { counts: StatusCounts }) {
  const finished = finishedCount(counts);
  const rate = formatPercent(counts.success_rate);

  return (
    <Link
      href="/runs"
      title={`Outcome of the ${finished} finished runs (${formatPercent(counts.success_rate)} succeeded). Click to open the runs list.`}
      className="flex items-center gap-5 rounded-[18px] border border-[rgba(167,139,250,0.18)] bg-[rgba(139,92,246,0.06)] px-5 py-4"
    >
      <span
        className="relative flex h-[120px] w-[120px] items-center justify-center rounded-full shadow-[0_0_40px_rgba(139,92,246,0.45)]"
        style={{ background: donutGradient(counts) }}
      >
        <span className="flex h-[90px] w-[90px] flex-col items-center justify-center gap-0.5 rounded-full bg-[#0d0718]">
          <span className="text-xl font-semibold tabular-nums text-white">{rate}</span>
          <span className="text-xs tracking-[0.08em] text-muted uppercase">success</span>
        </span>
      </span>
      <span className="flex flex-col gap-1.5 text-xs text-muted">
        <span className="text-[13px] text-ink">Outcome of {finished} finished runs</span>
        {(["succeeded", "failed", "cancelled"] as const).map((status) => (
          <span key={status} className="flex items-center gap-2">
            <span aria-hidden="true" className="h-[9px] w-[9px] rounded-[3px]" style={{ background: STATUS_COLORS[status] }} />
            {counts[status]} {status}
          </span>
        ))}
        {counts.running > 0 && (
          <span className="flex items-center gap-2 text-running">
            <span aria-hidden="true" className="pulse h-[9px] w-[9px] rounded-full bg-running" />+ {counts.running} still running
          </span>
        )}
      </span>
    </Link>
  );
}
