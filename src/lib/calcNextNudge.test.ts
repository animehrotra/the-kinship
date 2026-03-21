import { describe, it, expect } from "vitest";
import { calcNextNudge } from "./hooks";

describe("calcNextNudge", () => {
  const base = new Date("2025-01-15T12:00:00Z");

  it("weekly adds 7 days", () => {
    const result = new Date(calcNextNudge("weekly", base));
    expect(result.getDate()).toBe(22);
    expect(result.getMonth()).toBe(0); // Jan
  });

  it("biweekly adds 14 days", () => {
    const result = new Date(calcNextNudge("biweekly", base));
    expect(result.getDate()).toBe(29);
    expect(result.getMonth()).toBe(0);
  });

  it("monthly adds 1 month", () => {
    const result = new Date(calcNextNudge("monthly", base));
    expect(result.getMonth()).toBe(1); // Feb
    expect(result.getDate()).toBe(15);
  });

  it("quarterly adds 3 months", () => {
    const result = new Date(calcNextNudge("quarterly", base));
    expect(result.getMonth()).toBe(3); // April
    expect(result.getDate()).toBe(15);
  });

  it("unknown frequency returns same date", () => {
    const result = new Date(calcNextNudge("unknown", base));
    expect(result.getTime()).toBe(base.getTime());
  });

  it("defaults to current date when no from param", () => {
    const before = Date.now();
    const result = new Date(calcNextNudge("weekly")).getTime();
    const after = Date.now();
    // Should be roughly 7 days from now
    expect(result).toBeGreaterThanOrEqual(before + 7 * 86400000 - 1000);
    expect(result).toBeLessThanOrEqual(after + 7 * 86400000 + 1000);
  });
});
