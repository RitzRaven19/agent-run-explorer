"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import ErrorPanel from "@/components/ErrorPanel";
import { apiBaseUrl, describeError, explainUrl, fetchFailureMessage, readDetail } from "@/lib/api";

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
      setErrorMessage(error instanceof TypeError ? fetchFailureMessage(error, apiBaseUrl()) : describeError(error));
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

  // While text streams, a light runs round the card's border; the rest of the time it has a plain frosted border.
  const cardStyle = isStreaming
    ? "beam rounded-2xl"
    : "rounded-2xl border border-[rgba(167,139,250,0.18)] bg-linear-to-b from-[rgba(139,92,246,0.11)] to-[rgba(76,29,149,0.05)]";
  const startStyle = isStreaming
    ? "bg-white/[0.08] text-dim"
    : "bg-linear-to-br from-[#7c3aed] to-[#4c1d95] text-white shadow-[0_0_26px_rgba(139,92,246,0.55)]";

  return (
    <section aria-labelledby="explain-title" className={cardStyle}>
      <div className="flex flex-col gap-3.5 p-[22px]">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="explain-title" className="text-lg font-semibold">
            Explanation
          </h2>
          {status !== "error" && (
            <button
              type="button"
              onClick={explain}
              disabled={!isHydrated || isStreaming}
              className={`min-h-10 cursor-pointer rounded-[10px] border border-white/25 px-4 text-sm font-medium disabled:cursor-default ${startStyle} ${
                !isHydrated ? "opacity-60" : ""
              }`}
            >
              {buttonLabel()}
            </button>
          )}
          {isStreaming && (
            <button type="button" onClick={stop} className="outline-button border-white/[0.18]">
              Stop
            </button>
          )}
          {status === "stopped" && <span className="text-xs text-muted">Stopped before the end.</span>}
        </div>

        {status === "idle" && (
          <p className="text-sm text-muted">Get a short plain-English summary of what this run did, streamed word by word.</p>
        )}
        {status === "error" ? (
          <ErrorPanel title="The explanation could not be loaded" message={errorMessage} onRetry={explain} />
        ) : (
          // polite: screen readers read the new text when the user is idle instead of interrupting them.
          <div aria-live="polite" className="text-[15px] leading-[1.65] break-words whitespace-pre-wrap text-ink">
            {text}
            {isStreaming && (
              <span aria-hidden="true" className="cursor text-white">
                ▍
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
