"use client";

import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { nextRowIndex } from "@/lib/rowNavigation";

type Modifiers = { altKey: boolean; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean };

// Leave browser and screen reader shortcuts (Alt+Arrow is Back/Forward) alone.
function hasModifier(event: Modifiers): boolean {
  return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}

// Moves focus to the row `key` asks for. Returns true when the key was ours and focus moved.
function moveFocus(container: HTMLElement | null, key: string): boolean {
  const rows = Array.from(container?.querySelectorAll("tbody tr") ?? []);
  const currentRow = rows.findIndex((row) => row.contains(document.activeElement));
  const targetRow = nextRowIndex(currentRow, key, rows.length);
  if (targetRow === null) return false;

  rows[targetRow].querySelector<HTMLAnchorElement>("a[data-run-link]")?.focus();
  return true;
}

// Arrow keys move focus between the run links in the table; Enter then follows the focused link as usual.
// Two entry points: a handler on the table's wrapper (focus is already in the table), and a listener on the window
// for when nothing is focused. Typing in the search box never triggers either.
export default function KeyboardRows({ children, hintId }: { children: ReactNode; hintId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  function handleTableKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (hasModifier(event)) return;
    // preventDefault stops the page from scrolling by itself; focusing the link scrolls the row into view.
    if (moveFocus(containerRef.current, event.key)) event.preventDefault();
  }

  useEffect(() => {
    function handleWindowKeyDown(event: KeyboardEvent) {
      // Only when nothing is focused: the body is the active element. That rules out inputs, selects,
      // textareas, buttons and links in one check, so no key press meant for a control is taken over.
      if (hasModifier(event) || document.activeElement !== document.body) return;
      if (moveFocus(containerRef.current, event.key)) event.preventDefault();
    }

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, []);

  return (
    <div ref={containerRef} role="group" aria-label="Runs" aria-describedby={hintId} onKeyDown={handleTableKeyDown}>
      {children}
    </div>
  );
}
