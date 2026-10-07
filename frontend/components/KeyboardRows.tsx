"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { nextRowIndex } from "@/lib/rowNavigation";

// Arrow keys move focus between the run links in the table; Enter then follows the focused link as usual.
// The handler sits on this wrapper, which only contains the table, so typing in the search box never reaches it.
export default function KeyboardRows({ children, hintId }: { children: ReactNode; hintId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Leave browser and screen reader shortcuts (Alt+Arrow is Back/Forward) alone.
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    const rows = Array.from(containerRef.current?.querySelectorAll("tbody tr") ?? []);
    const currentRow = rows.findIndex((row) => row.contains(document.activeElement));
    const targetRow = nextRowIndex(currentRow, event.key, rows.length);
    if (targetRow === null) return;

    // Stop the page from scrolling by itself; focusing the link scrolls the row into view.
    event.preventDefault();
    rows[targetRow].querySelector<HTMLAnchorElement>("a[data-run-link]")?.focus();
  }

  return (
    <div ref={containerRef} role="group" aria-label="Runs" aria-describedby={hintId} onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
}
