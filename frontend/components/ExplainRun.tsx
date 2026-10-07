"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import ErrorPanel from "@/components/ErrorPanel";
import { apiBaseUrl, describeError, explainUrl, readDetail } from "@/lib/api";

type ExplainStatus = "idle" | "streaming" | "done" | "stopped" | "error";

// Nothing ever changes after hydration, so there is nothing to subscribe to.
function subscribeToNothing() {
  return () => {};
}

// Calls the backend straight from the browser: going through a Next.js server would add a hop
// that can hold the text back until the whole answer is ready, which defeats streaming.
export default function ExplainRun({ runId }: { runId: string }) {
  const [status, setStatus] = useState<ExplainStatus>("idle");
  const [text, setText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  // A ref, not state: swapping the controller must not re-render, and the cleanup below needs the latest one.
  const controllerRef = useRef<AbortController | null>(null);
  // false in the server HTML and during hydration, true right after. Until then the button has no click
  // handler attached, so it is shown disabled rather than letting a click be silently lost.
  const isHydrated = useSyncExternalStore(subscribeToNothing, () => true, () => false);

  // Leaving the page aborts a request that is still streaming, so it does not keep running unseen.
  useEffect(() => () => controllerRef.current?.abort(), []);

  async function explain() {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setText("");
    setErrorMessage("");
    setStatus("streaming");

    try {
      const response = await fetch(explainUrl(runId), { method: "POST", signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Backend error ${response.status}: ${await readDetail(response)}`);
      }
      if (!response.body) {
        throw new Error("This browser cannot read a streamed response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // stream: true holds back the first bytes of a character (é, emoji) that was split between chunks.
        // Decoded out here, not inside the updater, because React may call an updater twice in development.
        const chunk = decoder.decode(value, { stream: true });
        setText((previous) => previous + chunk);
      }
      const rest = decoder.decode();
      setText((previous) => previous + rest);
      setStatus("done");
    } catch (error) {
      // Stop, a newer request and leaving the page all abort on purpose; none of them is a failure.
      if (controller.signal.aborted) return;
      // fetch rejects with a TypeError when the server cannot be reached at all.
      setErrorMessage(error instanceof TypeError ? `Could not reach the backend at ${apiBaseUrl()}` : describeError(error));
      setStatus("error");
    }
  }

  function stop() {
    controllerRef.current?.abort();
    setStatus("stopped");
  }

  const isStreaming = status === "streaming";

  function buttonLabel(): string {
    if (!isHydrated) return "Loading…";
    if (status === "done" || status === "stopped") return "Explain again";
    return "Explain this run";
  }

  return (
    <section aria-labelledby="explain-title" className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="explain-title" className="text-lg font-semibold">
          Explanation
        </h2>
        {status !== "error" && (
          <button
            type="button"
            onClick={explain}
            disabled={!isHydrated || isStreaming}
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {buttonLabel()}
          </button>
        )}
        {isStreaming && (
          <button
            type="button"
            onClick={stop}
            className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
          >
            Stop
          </button>
        )}
      </div>

      {status === "idle" && (
        <p className="mt-3 text-sm text-slate-500">Get a short plain-English summary of what this run did.</p>
      )}
      {status === "error" ? (
        <div className="mt-4">
          <ErrorPanel title="The explanation could not be loaded" message={errorMessage} onRetry={explain} />
        </div>
      ) : (
        // polite: screen readers read the new text when the user is idle instead of interrupting them.
        <div aria-live="polite" className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">
          {text}
          {isStreaming && (
            <span aria-hidden="true" className="ml-0.5 animate-pulse">
              ▍
            </span>
          )}
        </div>
      )}
      {status === "stopped" && <p className="mt-2 text-xs text-slate-500">Stopped before the end.</p>}
    </section>
  );
}
