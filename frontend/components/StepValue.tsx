"use client";

import { useState } from "react";

const COLLAPSED_LINES = 10;

// A step's input or output, collapsed to its first lines when it is long.
export default function StepValue({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const lines = text.split("\n");
  const isLong = lines.length > COLLAPSED_LINES;
  const shownText = isLong && !isExpanded ? lines.slice(0, COLLAPSED_LINES).join("\n") : text;

  return (
    <div>
      <pre className="whitespace-pre-wrap break-words rounded bg-slate-50 p-2 font-mono text-xs">{shownText}</pre>
      {isLong && (
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-1 text-xs text-blue-700 hover:underline"
        >
          {isExpanded ? "Show less" : `Show more (${lines.length - COLLAPSED_LINES} more lines)`}
        </button>
      )}
    </div>
  );
}
