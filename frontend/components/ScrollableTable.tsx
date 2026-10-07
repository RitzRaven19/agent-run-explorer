"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Scrolls sideways when the table is wider than the screen. While there is more to the right, a soft fade and a
// "scroll →" hint say so; both go away once the right edge is reached, or when the table fits.
export default function ScrollableTable({ children }: { children: ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [hasMoreToRight, setHasMoreToRight] = useState(false);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    // The 1px of slack covers the fractional scroll positions some browsers report at the very end.
    const update = () => setHasMoreToRight(element.scrollLeft + element.clientWidth < element.scrollWidth - 1);
    element.addEventListener("scroll", update, { passive: true });
    // The observer calls update once when it starts watching, and again whenever the window or table is resized.
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(element);
    if (element.firstElementChild) resizeObserver.observe(element.firstElementChild);
    return () => {
      element.removeEventListener("scroll", update);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative">
      <div ref={scroller} className="overflow-x-auto">
        {children}
      </div>
      {hasMoreToRight && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-page/90 to-transparent">
          <span className="absolute top-2.5 right-2 rounded-full border border-white/[0.14] bg-page/80 px-2 py-0.5 text-xs whitespace-nowrap text-accent">
            scroll →
          </span>
        </div>
      )}
    </div>
  );
}
