import { stepAnchorId } from "@/lib/format";
import type { Run } from "@/lib/types";

export default function RunErrorBox({ run }: { run: Run }) {
  const { error } = run;
  if (error === null) return null;
  const failedStep = run.steps.find((step) => step.index === error.step_index);

  return (
    <section
      aria-labelledby="run-error-title"
      className="flex flex-col gap-2 rounded-2xl border border-failed/30 bg-gradient-to-b from-failed/10 to-failed/[0.04] px-[22px] py-5"
    >
      <h2 id="run-error-title" className="text-sm font-normal text-[#f9a8d4]">
        Error · <code className="font-mono">{error.type}</code>
      </h2>
      <p className="text-[15px] break-words whitespace-pre-wrap text-[#fce7f3]">{error.message}</p>
      {failedStep ? (
        <p className="text-[13px] text-[#f9a8d4]">
          Happened at step {failedStep.index} ({failedStep.name}).{" "}
          {/* A plain <a>, not next/link: only a real hash navigation updates the :target highlight. */}
          <a href={`#${stepAnchorId(failedStep.index)}`} className="text-white underline">
            Jump to step {failedStep.index}
          </a>
        </p>
      ) : (
        // run_0089: the error names step 3 but no steps were recorded, so there is nothing to link to.
        <p className="text-[13px] text-[#f9a8d4]">
          The error points to step {error.step_index}, but{" "}
          {run.steps.length === 0 ? "this run has no recorded steps" : `step ${error.step_index} was not recorded`}.
        </p>
      )}
    </section>
  );
}
