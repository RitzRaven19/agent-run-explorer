import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchFailureMessage, fetchRuns } from "@/lib/api";
import { DEFAULT_FILTERS } from "@/lib/filters";

const BASE_URL = "http://backend.test";

function timeoutError(): DOMException {
  return new DOMException("The operation was aborted due to timeout", "TimeoutError");
}

describe("message for a backend that never answered", () => {
  it("says the backend is waking up after a timeout", () => {
    expect(fetchFailureMessage(timeoutError(), BASE_URL)).toBe(
      "The backend is waking up — free hosting sleeps when idle. Try again in ~30 s.",
    );
  });

  it("names the address for any other network failure", () => {
    expect(fetchFailureMessage(new TypeError("fetch failed"), BASE_URL)).toBe(
      "Could not reach the backend at http://backend.test. It may be waking up — free hosting sleeps when idle. Try again in ~30 s.",
    );
  });
});

describe("backend requests", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("give up after a timeout and reject with the friendly message", async () => {
    vi.stubEnv("API_URL", BASE_URL);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutError()));

    await expect(fetchRuns(DEFAULT_FILTERS)).rejects.toThrow("The backend is waking up");
  });

  it("send an abort signal, so a hung backend cannot hang the page", async () => {
    vi.stubEnv("API_URL", BASE_URL);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [], total: 0, page: 1, page_size: 25 })));
    vi.stubGlobal("fetch", fetchMock);

    await fetchRuns(DEFAULT_FILTERS);

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(options.cache).toBe("no-store");
  });
});
