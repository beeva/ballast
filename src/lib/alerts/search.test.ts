import { describe, expect, it } from "vitest";
import { filterAlertRulesByQuery } from "./search";

const rules = [
  { serviceName: "Checkout API", metricName: "latency_ms" },
  { serviceName: "Checkout API", metricName: "error_rate" },
  { serviceName: "Sample Service", metricName: "cpu_percent" },
];

describe("filterAlertRulesByQuery", () => {
  it("returns every rule for an empty query", () => {
    expect(filterAlertRulesByQuery(rules, "")).toEqual(rules);
  });

  it("matches by service name, case-insensitively", () => {
    expect(filterAlertRulesByQuery(rules, "checkout")).toEqual([rules[0], rules[1]]);
  });

  it("matches by metric name", () => {
    expect(filterAlertRulesByQuery(rules, "error_rate")).toEqual([rules[1]]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterAlertRulesByQuery(rules, "does-not-exist")).toEqual([]);
  });
});
