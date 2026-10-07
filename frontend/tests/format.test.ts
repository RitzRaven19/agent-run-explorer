import { describe, expect, it } from "vitest";
import {
  formatCost,
  formatDateTimeUtc,
  formatDayLabel,
  formatDurationSeconds,
  formatPercent,
  formatPricedTotal,
  formatStepValue,
} from "@/lib/format";

describe("costs", () => {
  it("prints a real zero cost as $0.000000", () => {
    expect(formatCost(0)).toBe("$0.000000");
  });

  it("keeps six decimals, because single runs cost fractions of a cent", () => {
    expect(formatCost(1.530414)).toBe("$1.530414");
    expect(formatCost(0.0004)).toBe("$0.000400");
  });

  it("spells out unpriced runs instead of hiding them in the total", () => {
    expect(formatPricedTotal(1.530414, 1)).toBe("$1.530414 (1 unpriced)");
    expect(formatPricedTotal(2.709924, 0)).toBe("$2.709924");
    // An agent whose runs are all unpriced has a $0 priced total, but the label still says why.
    expect(formatPricedTotal(0, 2)).toBe("$0.000000 (2 unpriced)");
  });
});

describe("percent", () => {
  it("shows the success rate with two decimals", () => {
    expect(formatPercent(139 / 191)).toBe("72.77%");
    expect(formatPercent(1)).toBe("100.00%");
  });

  it("shows a dash, not 0%, when no run has finished", () => {
    expect(formatPercent(null)).toBe("—");
  });
});

describe("durations", () => {
  it("prints milliseconds as seconds with one decimal", () => {
    expect(formatDurationSeconds(23593)).toBe("23.6 s");
    expect(formatDurationSeconds(41530)).toBe("41.5 s");
    expect(formatDurationSeconds(0)).toBe("0.0 s");
  });
});

describe("dates", () => {
  it("prints the UTC time, whatever offset the timestamp was written with", () => {
    expect(formatDateTimeUtc("2026-07-20T23:30:00+05:30")).toBe("20 Jul 2026, 18:00 UTC");
    expect(formatDateTimeUtc("2026-08-31T23:59:00Z")).toBe("31 Aug 2026, 23:59 UTC");
  });

  it("labels a chart day the same way the backend counts it", () => {
    expect(formatDayLabel("2026-08-01")).toBe("1 Aug");
    expect(formatDayLabel("2026-07-20")).toBe("20 Jul");
  });
});

describe("step values", () => {
  it("pretty-prints JSON objects and arrays", () => {
    expect(formatStepValue('{"severity":"high","tags":["a","b"]}')).toBe(
      '{\n  "severity": "high",\n  "tags": [\n    "a",\n    "b"\n  ]\n}',
    );
    expect(formatStepValue("  [1, 2]  ")).toBe("[\n  1,\n  2\n]");
  });

  it("leaves plain text exactly as it came, whitespace included", () => {
    expect(formatStepValue("  Looked up the invoice.\n")).toBe("  Looked up the invoice.\n");
  });

  it("leaves text that only looks like JSON unchanged", () => {
    expect(formatStepValue("{not json")).toBe("{not json");
  });
});
