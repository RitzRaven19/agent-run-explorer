"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import { QUICK_PRESETS, isPresetActive, parseFilters, runsListHref } from "@/lib/filters";

// One-click starting points. They only rewrite the URL, so the page makes the usual single list request.
export default function QuickInvestigations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  return (
    <section aria-label="Quick investigations" className="flex flex-col gap-2.5">
      <h2 className="text-xs tracking-[0.1em] text-muted uppercase">Quick investigations</h2>
      <div className="flex flex-wrap gap-2">
        {QUICK_PRESETS.map((preset) => {
          const href = runsListHref(preset.filters);
          const active = isPresetActive(preset, filters);
          return (
            <button
              key={preset.label}
              type="button"
              className="chip"
              aria-pressed={active}
              title={href}
              // replace, not push, like the filter controls; clicking the active preset goes back to the default view.
              onClick={() => startTransition(() => router.replace(active ? "/runs" : href))}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
