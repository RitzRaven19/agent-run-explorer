"use client";

import { useState } from "react";
import { useLocationHash } from "@/lib/useLocationHash";

const COLLAPSED_LINES = 10;

// A step's input or output, collapsed to its first lines when it is long.
// When the URL points at the step (#anchorId) it opens expanded, so a deep link shows the whole value.
export default function StepValue({ text, anchorId }: { text: string; anchorId: string }) {
  const isTargeted = useLocationHash() === `#${anchorId}`;
  const [isExpanded, setIsExpanded] = useState(false);
  const [wasTargeted, setWasTargeted] = useState(false);

  // Expand only at the moment the URL starts pointing here, so "Show less" still works afterwards.
  if (isTargeted !== wasTargeted) {
    setWasTargeted(isTargeted);
    if (isTargeted) {
      setIsExpanded(true);
    }
  }

  const lines = text.split("\n");
  const isLong = lines.length > COLLAPSED_LINES;
  const shownText = isLong && !isExpanded ? lines.slice(0, COLLAPSED_LINES).join("\n") : text;

  return (
    <div>
      <pre className="rounded-[10px] border border-white/[0.06] bg-black/40 p-3 font-mono text-[12.5px] break-words whitespace-pre-wrap text-soft [overflow-wrap:anywhere]">
        {shownText}
      </pre>
      {isLong && (
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-1 cursor-pointer text-xs text-accent hover:underline"
        >
          {isExpanded ? "Show less" : `Show more (${lines.length - COLLAPSED_LINES} more lines)`}
        </button>
      )}
    </div>
  );
}
