import { beforeEach, describe, expect, it, vi } from "vitest";

// The counter keeps its state in the module, so each test loads a fresh copy.
async function loadCounter() {
  return import("@/lib/requestCounter");
}

describe("request counter", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("starts at zero", async () => {
    const { getRequestCount } = await loadCounter();
    expect(getRequestCount()).toBe(0);
  });

  it("counts each new request id once", async () => {
    const { getRequestCount, recordRequest } = await loadCounter();

    recordRequest("a");
    recordRequest("b");

    expect(getRequestCount()).toBe(2);
  });

  it("does not count the same id twice, as when React runs an effect twice", async () => {
    const { getRequestCount, recordRequest } = await loadCounter();

    recordRequest("a");
    recordRequest("a");

    expect(getRequestCount()).toBe(1);
  });

  it("tells subscribers about a new request but not about a repeat, and stops after unsubscribing", async () => {
    const { recordRequest, subscribeToRequests } = await loadCounter();
    const listener = vi.fn();
    const unsubscribe = subscribeToRequests(listener);

    recordRequest("a");
    recordRequest("a");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    recordRequest("b");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
