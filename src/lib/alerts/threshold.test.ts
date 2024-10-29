import { describe, expect, it } from "vitest";
import { average, compareValue, isComparator } from "./threshold";

describe("isComparator", () => {
  it("accepts all four comparators", () => {
    expect(isComparator("gt")).toBe(true);
    expect(isComparator("gte")).toBe(true);
    expect(isComparator("lt")).toBe(true);
    expect(isComparator("lte")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isComparator("eq")).toBe(false);
    expect(isComparator("")).toBe(false);
    expect(isComparator("GT")).toBe(false);
  });
});

describe("compareValue", () => {
  it("gt is strictly greater", () => {
    expect(compareValue(5, "gt", 4)).toBe(true);
    expect(compareValue(5, "gt", 5)).toBe(false);
  });

  it("gte includes equality", () => {
    expect(compareValue(5, "gte", 5)).toBe(true);
    expect(compareValue(4, "gte", 5)).toBe(false);
  });

  it("lt is strictly less", () => {
    expect(compareValue(3, "lt", 4)).toBe(true);
    expect(compareValue(4, "lt", 4)).toBe(false);
  });

  it("lte includes equality", () => {
    expect(compareValue(4, "lte", 4)).toBe(true);
    expect(compareValue(5, "lte", 4)).toBe(false);
  });
});

describe("average", () => {
  it("computes the arithmetic mean", () => {
    expect(average([1, 2, 3])).toBe(2);
    expect(average([10])).toBe(10);
  });

  it("returns null for an empty window, not zero or NaN", () => {
    expect(average([])).toBeNull();
  });

  it("a real average of zeros is 0, distinguishable from null", () => {
    expect(average([0, 0, 0])).toBe(0);
  });
});
