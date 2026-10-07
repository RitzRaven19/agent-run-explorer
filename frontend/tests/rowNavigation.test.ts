import { describe, expect, it } from "vitest";
import { nextRowIndex } from "@/lib/rowNavigation";

describe("nextRowIndex", () => {
  it("moves down and up one row at a time", () => {
    expect(nextRowIndex(2, "ArrowDown", 5)).toBe(3);
    expect(nextRowIndex(2, "ArrowUp", 5)).toBe(1);
  });

  it("stops at the first and last row instead of wrapping", () => {
    expect(nextRowIndex(4, "ArrowDown", 5)).toBe(4);
    expect(nextRowIndex(0, "ArrowUp", 5)).toBe(0);
  });

  it("starts at the first row going down and the last row going up when no row is focused", () => {
    expect(nextRowIndex(-1, "ArrowDown", 5)).toBe(0);
    expect(nextRowIndex(-1, "ArrowUp", 5)).toBe(4);
  });

  it("leaves every other key alone, including Enter, which the focused link handles itself", () => {
    expect(nextRowIndex(2, "Enter", 5)).toBeNull();
    expect(nextRowIndex(2, "a", 5)).toBeNull();
    expect(nextRowIndex(2, "ArrowLeft", 5)).toBeNull();
  });

  it("does nothing for an empty table", () => {
    expect(nextRowIndex(-1, "ArrowDown", 0)).toBeNull();
  });
});
