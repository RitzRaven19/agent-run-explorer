import { STATUS_COLORS } from "@/lib/statusColors";
import ScrollToStep from "@/components/ScrollToStep";
import StatusBadge from "@/components/StatusBadge";
import StepValue from "@/components/StepValue";
import { formatDurationSeconds, formatStepValue, formatTimeUtc, stepAnchorId } from "@/lib/format";
import type { Run, RunStatus, Step } from "@/lib/types";

const SECTION_LABEL = "text-[11px] tracking-[0.1em] text-dim uppercase";

// The glow round each step's dot on the rail, in the step's status colour.
const DOT_GLOW: Record<RunStatus, string> = {
  succeeded: "0 0 12px rgba(196,181,253,0.7)",
  failed: "0 0 14px rgba(244,114,182,0.8)",
  cancelled: "0 0 10px rgba(139,135,163,0.6)",
  running: "0 0 12px rgba(129,140,248,0.8)",
};

function StepTime({ step }: { step: Step }) {
  if (step.duration_ms !== null) return <>{formatDurationSeconds(step.duration_ms)}</>;
  return <>{step.status === "running" ? "still running" : "—"}</>;
}

function StepCard({ step, isFailing }: { step: Step; isFailing: boolean }) {
  const isRunning = step.status === "running";
  // A failing step swaps the frosted glass for a pink one; every other step keeps the glass.
  const cardStyle = isFailing
    ? "border border-failed/45 bg-linear-to-b from-failed/[0.08] to-white/[0.02] shadow-[0_0_40px_rgba(244,114,182,0.12)]"
    : "glass";

  return (
    // scroll-mt leaves a gap above the card when #step-N scrolls it to the top; target: styles the card the URL points at.
    <li id={stepAnchorId(step.index)} className="relative scroll-mt-4">
      <span
        aria-hidden="true"
        className="absolute top-[22px] -left-[35px] h-3 w-3 rounded-full"
        style={{ background: STATUS_COLORS[step.status], boxShadow: DOT_GLOW[step.status] }}
      />
      <div className={`flex flex-col gap-3.5 rounded-[14px] px-5 py-[18px] ${cardStyle} [li:target_&]:ring-2 [li:target_&]:ring-[#a78bfa]`}>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-xs text-dim">Step {step.index}</span>
          <h3 className="text-[15px] font-semibold">{step.name}</h3>
          <span className="rounded-md bg-white/[0.07] px-2 py-0.5 font-mono text-[11px] text-soft">{step.tool}</span>
          <StatusBadge status={step.status} size="sm" />
          {isFailing && (
            <span className="rounded-full bg-failed/25 px-[9px] py-0.5 text-[11px] text-[#fce7f3]">Failed here</span>
          )}
          {isRunning && (
            <span className="flex items-center gap-1 text-xs text-running">
              <span aria-hidden="true" className="pulse h-2 w-2 rounded-full bg-running" />
              In progress
            </span>
          )}
          <span
            title={`Started ${formatTimeUtc(step.started_at)}`}
            className="ml-auto font-mono text-xs text-muted"
          >
            <StepTime step={step} /> · {step.tokens.input.toLocaleString("en-US")} in /{" "}
            {step.tokens.output.toLocaleString("en-US")} out
          </span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
          <div className="flex flex-col gap-1.5">
            <span className={SECTION_LABEL}>Input</span>
            <StepValue text={formatStepValue(step.input)} anchorId={stepAnchorId(step.index)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={SECTION_LABEL}>Output</span>
            {step.output === null ? (
              <p className="rounded-[10px] border border-dashed border-white/10 bg-black/40 p-3 text-[13px] text-muted italic">
                no output
              </p>
            ) : (
              <StepValue text={formatStepValue(step.output)} anchorId={stepAnchorId(step.index)} />
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export default function StepsTimeline({ run }: { run: Run }) {
  return (
    <section aria-labelledby="steps-title" className="flex flex-col gap-3.5">
      <h2 id="steps-title" className="text-lg font-semibold">
        Steps <span className="font-normal text-dim">({run.steps.length})</span>
      </h2>
      {run.steps.length === 0 ? (
        <p className="glass rounded-2xl p-4 text-sm text-muted">No steps recorded for this run.</p>
      ) : (
        <ol className="ml-2 flex flex-col gap-4 border-l border-white/[0.12] pl-7">
          {run.steps.map((step) => (
            <StepCard key={step.index} step={step} isFailing={step.index === run.error?.step_index} />
          ))}
        </ol>
      )}
      <ScrollToStep />
    </section>
  );
}
