import Link from "next/link";
import { getGlobalStats } from "@/lib/globalStats";
import type { StatsResponse } from "@/lib/types";

const PILL_STYLE =
  "ml-auto flex items-center gap-2.5 rounded-full border border-[rgba(167,139,250,0.2)] bg-[rgba(139,92,246,0.06)] px-3 py-1.5 text-xs text-muted";

// Placeholder while the stats load (and in the static shell), the same size as the real pill.
export function HealthPillPlaceholder() {
  return (
    <span className={PILL_STYLE}>
      <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-dim" />
      Connecting…
    </span>
  );
}

// The backend's state at a glance: how many runs it loaded and how many data problems it flagged.
// A failed request shows as "unreachable" instead of breaking every page, because this sits in the layout.
export default async function HealthPill() {
  let stats: StatsResponse | null = null;
  try {
    stats = await getGlobalStats();
  } catch {
    stats = null;
  }

  if (stats === null) {
    return (
      <Link href="/dashboard" title="The backend did not answer. It may be waking up; reload in a moment." className={PILL_STYLE}>
        <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-failed" />
        <span className="text-failed">Backend unreachable</span>
      </Link>
    );
  }

  const warningCount = stats.data_warnings.length;
  return (
    <Link
      href="/dashboard"
      title={`Backend health: ${stats.overall.total} runs loaded, ${warningCount} data ${warningCount === 1 ? "warning" : "warnings"}. Open the dashboard to see them.`}
      className={PILL_STYLE}
    >
      <span aria-hidden="true" className="pulse h-[7px] w-[7px] rounded-full bg-accent shadow-[0_0_10px_#c4b5fd]" />
      <span>
        Live · <strong className="font-medium text-ink">{stats.overall.total}</strong> runs
      </span>
      {warningCount > 0 && <span className="text-warn">⚠ {warningCount} {warningCount === 1 ? "warning" : "warnings"}</span>}
    </Link>
  );
}
