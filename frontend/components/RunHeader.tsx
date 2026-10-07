import type { ReactNode } from "react";
import { CostValue, DurationValue } from "@/components/RunValues";
import StatusBadge from "@/components/StatusBadge";
import { formatDateTimeUtc } from "@/lib/format";
import type { Run } from "@/lib/types";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-500">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function formatOptionalDate(iso: string | null): string {
  return iso === null ? "—" : formatDateTimeUtc(iso);
}

export default function RunHeader({ run }: { run: Run }) {
  const totalTokens = run.input_tokens + run.output_tokens;

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-semibold">{run.id}</h1>
        <StatusBadge status={run.status} />
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-4">
        <Field label="Agent">{run.agent}</Field>
        <Field label="Model">{run.model}</Field>
        <Field label="Tenant">{run.tenant_id}</Field>
        <Field label="Steps">{run.steps.length}</Field>
        <Field label="Started">{formatOptionalDate(run.started_at)}</Field>
        <Field label="Ended">{formatOptionalDate(run.ended_at)}</Field>
        <Field label="Duration">
          <DurationValue run={run} />
        </Field>
        <Field label="Cost">
          <span className="font-mono">
            <CostValue costUsd={run.cost_usd} />
          </span>
        </Field>
        <Field label="Tokens">
          {totalTokens.toLocaleString("en-US")}{" "}
          <span className="text-slate-500">
            ({run.input_tokens.toLocaleString("en-US")} in, {run.output_tokens.toLocaleString("en-US")} out)
          </span>
        </Field>
      </dl>

      <div>
        <h2 className="text-xs uppercase text-slate-500">Prompt</h2>
        {/* pre-wrap keeps the prompt's own line breaks and spacing but still wraps long lines. */}
        <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-slate-50 p-3 font-sans text-sm">
          {run.prompt}
        </pre>
      </div>
    </section>
  );
}
