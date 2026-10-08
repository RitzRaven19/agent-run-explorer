import Link from "next/link";
import { getHealth } from "@/lib/globalStats";
import type { HealthResponse } from "@/lib/types";

const PILL_STYLE =
  "ml-auto flex items-center gap-2.5 rounded-full border border-[rgba(167,139,250,0.2)] bg-[rgba(139,92,246,0.06)] px-3 py-1.5 text-xs text-muted max-md:min-h-10";

// Placeholder while the health check loads (and in the static shell), the same size as the real pill.
export function HealthPillPlaceholder() {
  return (
    <span className={PILL_STYLE}>
      <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-dim" />
      Connecting…
    </span>
  );
}

// The backend's state at a glance: how many runs it loaded and how many data problems it flagged.
// The data is a fixed file, so this says "online", not "live". A failed request shows as "unreachable" instead of
// breaking every page, because this sits in the layout.
export default async function HealthPill() {
  let health: HealthResponse | null = null;
  try {
    health = await getHealth();
  } catch {
    health = null;
  }

  if (health === null) {
    return (
      <Link href="/dashboard" title="The backend did not answer. It may be waking up; reload in a moment." className={PILL_STYLE}>
        <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-failed/60" />
        <span className="text-failed/80">Backend unreachable</span>
      </Link>
    );
  }

  const warningCount = health.data_warnings.length;
  const warningWord = warningCount === 1 ? "warning" : "warnings";
  return (
    <Link
      href="/dashboard"
      title={`Backend health: ${health.run_count} runs loaded, ${warningCount} data ${warningWord}. Open the dashboard to see them.`}
      className={PILL_STYLE}
    >
      <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-accent" />
      <span>
        Backend online · <strong className="font-medium text-ink">{health.run_count}</strong> runs
      </span>
      {warningCount > 0 && (
        <span className="text-warn">
          ⚠ {warningCount}
          <span className="sr-only"> data {warningWord}</span>
        </span>
      )}
    </Link>
  );
}
