import { describe, expect, it } from "vitest";
import { AGENT_NAMES } from "@/lib/types";
import {
  DEFAULT_FILTERS,
  backToRunsHref,
  parseFilters,
  runDetailHref,
  runsForAgentHref,
  runsForDayHref,
  runsListHref,
  toSearchParams,
  type RunFilters,
} from "@/lib/filters";

function parseQuery(query: string): RunFilters {
  return parseFilters(new URLSearchParams(query));
}

describe("parseFilters and toSearchParams", () => {
  it("round-trips every filter, including repeated status and agent params", () => {
    const filters: RunFilters = {
      status: ["succeeded", "failed"],
      agent: ["email-drafter", "kpi-analyst"],
      tool: ["sql", "http"],
      q: "invoice",
      started_from: "2026-07-20",
      started_to: "2026-08-31",
      sort: "cost_usd",
      order: "asc",
      page: 3,
      page_size: 50,
    };
    const query = toSearchParams(filters).toString();

    expect(query).toContain("status=succeeded&status=failed");
    expect(query).toContain("agent=email-drafter&agent=kpi-analyst");
    expect(query).toContain("tool=sql&tool=http");
    expect(parseQuery(query)).toEqual(filters);
  });

  it("round-trips every agent name, so the agent chips can never offer one the URL would drop", () => {
    const query = toSearchParams({ ...DEFAULT_FILTERS, agent: [...AGENT_NAMES] }).toString();

    expect(parseQuery(query).agent).toEqual([...AGENT_NAMES]);
    // The names must match backend/app/models.py exactly; this is the list the backend accepts.
    expect(AGENT_NAMES).toEqual([
      "contract-reviewer",
      "email-drafter",
      "invoice-extractor",
      "kpi-analyst",
      "support-router",
    ]);
  });

  it("reads the plain object that Next gives a page the same way as URLSearchParams", () => {
    const fromObject = parseFilters({ status: ["failed", "running"], agent: "kpi-analyst", page: "2" });
    const fromParams = parseQuery("status=failed&status=running&agent=kpi-analyst&page=2");

    expect(fromObject).toEqual(fromParams);
    expect(fromObject.status).toEqual(["failed", "running"]);
  });

  it("leaves default values out of the URL", () => {
    expect(toSearchParams(DEFAULT_FILTERS).toString()).toBe("");
    expect(runsListHref(DEFAULT_FILTERS)).toBe("/runs");
    expect(runsListHref({ ...DEFAULT_FILTERS, page: 2 })).toBe("/runs?page=2");
  });

  it("writes repeated values once each, in a fixed order", () => {
    expect(parseQuery("status=running&status=failed&status=running").status).toEqual(["failed", "running"]);
  });
});

describe("invalid values fall back to the defaults", () => {
  it.each([
    ["an unknown sort field", "sort=prompt", "sort", DEFAULT_FILTERS.sort],
    ["an unknown order", "order=sideways", "order", DEFAULT_FILTERS.order],
    ["a negative page", "page=-3", "page", DEFAULT_FILTERS.page],
    ["page zero", "page=0", "page", DEFAULT_FILTERS.page],
    ["a non-numeric page", "page=two", "page", DEFAULT_FILTERS.page],
    ["a page size over 100", "page_size=999", "page_size", DEFAULT_FILTERS.page_size],
    ["a fractional page size", "page_size=10.5", "page_size", DEFAULT_FILTERS.page_size],
  ] as const)("%s", (_label, query, key, expected) => {
    expect(parseQuery(query)[key]).toBe(expected);
  });

  it("drops unknown statuses and agents but keeps the valid ones", () => {
    const filters = parseQuery("status=exploded&status=failed&agent=nobody&agent=kpi-analyst");

    expect(filters.status).toEqual(["failed"]);
    expect(filters.agent).toEqual(["kpi-analyst"]);
  });

  it("drops unknown tools but keeps the valid ones", () => {
    expect(parseQuery("tool=hammer&tool=sql").tool).toEqual(["sql"]);
    expect(parseQuery("tool=hammer").tool).toEqual([]);
  });

  it("writes repeated tools once each, in the fixed tool order", () => {
    expect(parseQuery("tool=none&tool=llm&tool=none").tool).toEqual(["llm", "none"]);
  });

  it("trims the search text", () => {
    expect(parseQuery("q=%20%20refund%20").q).toBe("refund");
  });
});

describe("date filters", () => {
  it("accepts real YYYY-MM-DD dates", () => {
    const filters = parseQuery("started_from=2026-07-20&started_to=2026-08-31");

    expect(filters.started_from).toBe("2026-07-20");
    expect(filters.started_to).toBe("2026-08-31");
  });

  it.each(["2026-02-31", "07/20/2026", "2026-7-2", "20-07-2026", "yesterday"])("rejects %s", (date) => {
    expect(parseQuery(`started_from=${date}`).started_from).toBe("");
  });

  it("drops a reversed range, which the backend would reject", () => {
    const filters = parseQuery("started_from=2026-08-31&started_to=2026-07-20");

    expect(filters.started_from).toBe("");
    expect(filters.started_to).toBe("");
  });
});

describe("links between the list and a run", () => {
  it("only adds ?from= when the list has filters", () => {
    expect(runDetailHref("run_0042", DEFAULT_FILTERS)).toBe("/runs/run_0042");
    expect(runDetailHref("run_0042", { ...DEFAULT_FILTERS, status: ["failed"], page: 2 })).toBe(
      "/runs/run_0042?from=status%3Dfailed%26page%3D2",
    );
  });

  it("restores the list's filters from a valid ?from=", () => {
    expect(backToRunsHref("status=failed&agent=kpi-analyst&page=2")).toBe(
      "/runs?status=failed&agent=kpi-analyst&page=2",
    );
  });

  it("links a dashboard day to exactly that day's runs", () => {
    expect(runsForDayHref("2026-08-11")).toBe("/runs?started_from=2026-08-11&started_to=2026-08-11");
  });

  it("links a dashboard agent to that agent's runs", () => {
    expect(runsForAgentHref("kpi-analyst")).toBe("/runs?agent=kpi-analyst");
  });

  it.each([undefined, "", "//evil.com", "https://evil.com", "javascript:alert(1)"])(
    "never leaves /runs for from=%s",
    (from) => {
      expect(backToRunsHref(from)).toBe("/runs");
    },
  );
});
