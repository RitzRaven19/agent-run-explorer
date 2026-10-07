import { useSyncExternalStore } from "react";

function subscribeToHashChange(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

// The URL's #fragment, e.g. "#step-3" ("" when there is none). It is "" on the server, which cannot see the fragment,
// and updates when the user follows a link like "Jump to step 3".
export function useLocationHash(): string {
  return useSyncExternalStore(
    subscribeToHashChange,
    () => window.location.hash,
    () => "",
  );
}
