import type { ReactNode } from "react";
import { CostValue, DurationValue } from "@/components/RunValues";
import StatusBadge from "@/components/StatusBadge";
import StepWaterfall from "@/components/StepWaterfall";
import { formatDateTimeUtc } from "@/lib/format";
import type { Run } from "@/lib/types";

// big: the number is shown large and in monospace (duration, cost, tokens, steps).
function Field({ label, children, title, big = false }: { label: string; children: ReactNode; title?: string; big?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[11px] tracking-[0.1em] text-dim uppercase">{label}</dt>
      <dd title={title} className={big ? "font-mono text-[22px]" : "text-sm"}>
        {children}
      </dd>
    </div>
  );
}

function formatOptionalDate(iso: string | null): string {
  return iso === null ? "—" : formatDateTimeUtc(iso);
}

export default function RunHeader({ run }: { run: Run }) {
  const totalTokens = run.input_tokens + run.output_tokens;

  return (
    <section aria-label="Run summary" className="glass flex flex-col gap-[22px] rounded-[18px] p-[26px]">
      <div className="flex flex-wrap items-center gap-3.5">
        <h1 className="bg-linear-to-b from-white from-20% to-[#a78bfa] bg-clip-text font-mono text-[30px] font-medium tracking-[-0.02em] text-transparent">
          {run.id}
        </h1>
        <StatusBadge status={run.status} size="lg" />
        <span className="text-sm text-muted">
          {run.agent} · {run.model} · {run.tenant_id}
        </span>
      </div>

      <dl className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[18px]">
        <Field label="Started">{formatDateTimeUtc(run.started_at)}</Field>
        <Field label="Ended">{formatOptionalDate(run.ended_at)}</Field>
        <Field label="Duration" big>
          <DurationValue run={run} />
        </Field>
        <Field label="Cost" big>
          <CostValue costUsd={run.cost_usd} />
        </Field>
        <Field
          label="Tokens"
          big
          title={`${run.input_tokens.toLocaleString("en-US")} in · ${run.output_tokens.toLocaleString("en-US")} out`}
        >
          {totalTokens.toLocaleString("en-US")}
        </Field>
        <Field label="Steps" big>
          {run.steps.length}
        </Field>
      </dl>

      <StepWaterfall run={run} failingIndex={run.error?.step_index ?? null} />

      <div className="flex flex-col gap-2">
        <h2 className="text-[11px] tracking-[0.1em] text-dim uppercase">Prompt</h2>
        {/* pre-wrap keeps the prompt's own line breaks and spacing but still wraps long lines. */}
        <p className="rounded-xl border border-white/[0.06] bg-black/35 px-4 py-3.5 text-[15px] break-words whitespace-pre-wrap">
          {run.prompt}
        </p>
      </div>
    </section>
  );
}
