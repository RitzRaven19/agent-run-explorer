import type { RunStatus } from "@/lib/types";

const STATUS_STYLES: Record<RunStatus, { badge: string; dot: string }> = {
  succeeded: { badge: "border-succeeded/[0.28] bg-succeeded/[0.12] text-succeeded", dot: "bg-succeeded" },
  failed: { badge: "border-failed/[0.28] bg-failed/[0.12] text-failed", dot: "bg-failed" },
  cancelled: { badge: "border-cancelled/30 bg-cancelled/[0.12] text-cancelled", dot: "bg-cancelled" },
  // A running run's dot glows, so it reads as "still going".
  running: { badge: "border-running/[0.28] bg-running/[0.12] text-running", dot: "bg-running shadow-[0_0_8px_#818cf8]" },
};

// sm: inside a step card (no dot). md: in the runs table. lg: next to the run id on the detail page.
const SIZES = {
  sm: "px-[9px] py-0.5 text-xs",
  md: "gap-1.5 px-2.5 py-[3px] text-xs",
  lg: "gap-1.5 px-3 py-1 text-xs",
};

export default function StatusBadge({ status, size = "md" }: { status: RunStatus; size?: keyof typeof SIZES }) {
  const { badge, dot } = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center rounded-full border ${SIZES[size]} ${badge}`}>
      {size !== "sm" && <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {status}
    </span>
  );
}
