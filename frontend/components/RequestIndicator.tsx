"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getRequestCount, recordRequest, subscribeToRequests } from "@/lib/requestCounter";

// Shows how long the list request took and how many list requests this tab has made, so a reviewer can
// watch the count go up by one per filter change (not per keystroke, because the search is debounced).
export default function RequestIndicator({ requestId, durationMs }: { requestId: string; durationMs: number }) {
  useEffect(() => recordRequest(requestId), [requestId]);
  // 0 on the server and while hydrating; the real count appears right after.
  const requestCount = useSyncExternalStore(subscribeToRequests, getRequestCount, () => 0);

  return (
    <p className="font-mono text-xs text-dim">
      List request: {Math.round(durationMs)} ms
      {requestCount > 0 && ` · ${requestCount} ${requestCount === 1 ? "request" : "requests"} this session`}
    </p>
  );
}
