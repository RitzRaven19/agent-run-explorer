// Counts the list requests this browser tab has seen. It lives in module memory, so it survives
// client-side navigation and starts again from zero on a full page reload.
//
// Each list request gets its own id on the server. Counting distinct ids (not renders) means that
// React running an effect twice in development, or showing an old result again on Back, adds nothing.
const seenRequestIds = new Set<string>();
const listeners = new Set<() => void>();

export function recordRequest(requestId: string): void {
  if (seenRequestIds.has(requestId)) return;
  seenRequestIds.add(requestId);
  listeners.forEach((listener) => listener());
}

export function getRequestCount(): number {
  return seenRequestIds.size;
}

export function subscribeToRequests(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
