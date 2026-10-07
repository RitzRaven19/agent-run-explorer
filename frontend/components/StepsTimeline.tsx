import ScrollToStep from "@/components/ScrollToStep";
import StatusBadge from "@/components/StatusBadge";
import StepValue from "@/components/StepValue";
import { formatDurationSeconds, formatStepValue, formatTimeUtc, stepAnchorId } from "@/lib/format";
import type { Run, Step } from "@/lib/types";

function borderStyle(isFailing: boolean, isRunning: boolean): string {
  if (isFailing) return "border-red-300";
  if (isRunning) return "border-blue-300";
  return "border-slate-200";
}

function StepDuration({ step }: { step: Step }) {
  if (step.duration_ms !== null) return <>{formatDurationSeconds(step.duration_ms)}</>;
  return <>{step.status === "running" ? "still running" : "—"}</>;
}

function StepCard({ step, isFailing }: { step: Step; isFailing: boolean }) {
  const isRunning = step.status === "running";

  return (
    // scroll-mt leaves a gap above the card when #step-N scrolls it to the top; target: styles the card the URL points at.
    <li
      id={stepAnchorId(step.index)}
      className={`scroll-mt-4 rounded-lg border bg-white p-4 target:bg-blue-50 target:ring-2 target:ring-blue-400 ${borderStyle(isFailing, isRunning)}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-slate-500">Step {step.index}</span>
        <h3 className="font-medium">{step.name}</h3>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">{step.tool}</span>
        <StatusBadge status={step.status} />
        {isFailing && <span className="text-xs font-semibold text-red-700">Failed here</span>}
        {isRunning && (
          <span className="flex items-center gap-1 text-xs text-blue-700">
            <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
            In progress
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Started {formatTimeUtc(step.started_at)} · <StepDuration step={step} /> · {step.tokens.input} in /{" "}
        {step.tokens.output} out tokens
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <h4 className="mb-1 text-xs uppercase text-slate-500">Input</h4>
          <StepValue text={formatStepValue(step.input)} anchorId={stepAnchorId(step.index)} />
        </div>
        <div>
          <h4 className="mb-1 text-xs uppercase text-slate-500">Output</h4>
          {step.output === null ? (
            <p className="text-xs italic text-slate-500">no output</p>
          ) : (
            <StepValue text={formatStepValue(step.output)} anchorId={stepAnchorId(step.index)} />
          )}
        </div>
      </div>
    </li>
  );
}

export default function StepsTimeline({ run }: { run: Run }) {
  return (
    <section aria-labelledby="steps-title">
      <h2 id="steps-title" className="mb-2 text-lg font-semibold">
        Steps ({run.steps.length})
      </h2>
      {run.steps.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          No steps recorded for this run.
        </p>
      ) : (
        <ol className="space-y-3">
          {run.steps.map((step) => (
            <StepCard key={step.index} step={step} isFailing={step.index === run.error?.step_index} />
          ))}
        </ol>
      )}
      <ScrollToStep />
    </section>
  );
}
