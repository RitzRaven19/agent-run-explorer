"use client";

import { useEffect } from "react";

function scrollToHashTarget() {
  document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
}

// The browser scrolls to #step-N itself, but this page streams in, so that happens before the steps exist and is
// often lost. Scrolling again once the page has hydrated (and on every hash change) makes the deep link reliable.
export default function ScrollToStep() {
  useEffect(() => {
    scrollToHashTarget();
    window.addEventListener("hashchange", scrollToHashTarget);
    return () => window.removeEventListener("hashchange", scrollToHashTarget);
  }, []);

  return null;
}
