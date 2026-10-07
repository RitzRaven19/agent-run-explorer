import type { Run } from "@/lib/types";

export default function RunErrorBox({ run }: { run: Run }) {
  const { error } = run;
  if (error === null) return null;
  const failedStep = run.steps.find((step) => step.index === error.step_index);

  return (
    <section aria-labelledby="run-error-title" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm">
      <h2 id="run-error-title" className="font-semibold text-red-800">
        Error: <span className="font-mono">{error.type}</span>
      </h2>
      <p className="mt-1 whitespace-pre-wrap break-words text-red-900">{error.message}</p>
      {failedStep ? (
        <p className="mt-2 text-red-900">
          Happened at step {failedStep.index} ({failedStep.name}).{" "}
          {/* A plain <a>, not next/link: only a real hash navigation updates the :target highlight. */}
          <a href={`#step-${failedStep.index}`} className="font-medium underline">
            Jump to step {failedStep.index}
          </a>
        </p>
      ) : (
        // run_0089: the error names step 3 but no steps were recorded, so there is nothing to link to.
        <p className="mt-2 text-red-900">
          The error points to step {error.step_index}, but{" "}
          {run.steps.length === 0 ? "this run has no recorded steps" : `step ${error.step_index} was not recorded`}.
        </p>
      )}
    </section>
  );
}
