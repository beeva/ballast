import { describe, expect, it } from "vitest";
import { groupMetricsByName } from "./group";

const t = (secondsAgo: number) => new Date(Date.now() - secondsAgo * 1000);

describe("groupMetricsByName", () => {
  it("returns an empty array for no rows", () => {
    expect(groupMetricsByName([])).toEqual([]);
  });

  it("groups rows by metric name and sorts groups alphabetically", () => {
    const rows = [
      { metricName: "latency_ms", value: "142", recordedAt: t(0) },
      { metricName: "error_rate", value: "0.4", recordedAt: t(1) },
    ];
    const groups = groupMetricsByName(rows);
    expect(groups.map((g) => g.metricName)).toEqual(["error_rate", "latency_ms"]);
  });

  it("derives trend from the two most recent points, newest first", () => {
    const rising = groupMetricsByName([
      { metricName: "latency_ms", value: "200", recordedAt: t(0) },
      { metricName: "latency_ms", value: "150", recordedAt: t(60) },
    ]);
    expect(rising[0]?.trend).toBe("up");

    const falling = groupMetricsByName([
      { metricName: "latency_ms", value: "100", recordedAt: t(0) },
      { metricName: "latency_ms", value: "150", recordedAt: t(60) },
    ]);
    expect(falling[0]?.trend).toBe("down");

    const flat = groupMetricsByName([
      { metricName: "latency_ms", value: "150", recordedAt: t(0) },
      { metricName: "latency_ms", value: "150", recordedAt: t(60) },
    ]);
    expect(flat[0]?.trend).toBe("flat");
  });

  it("trend is null with only one point for a metric", () => {
    const groups = groupMetricsByName([{ metricName: "latency_ms", value: "150", recordedAt: t(0) }]);
    expect(groups[0]?.trend).toBeNull();
  });

  it("caps recentValues per metric without dropping the latest value", () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      metricName: "latency_ms",
      value: String(i),
      recordedAt: t(i),
    }));
    const [group] = groupMetricsByName(rows);
    expect(group?.recentValues.length).toBeLessThanOrEqual(8);
    expect(group?.recentValues[0]).toBe(0);
    expect(group?.latestValue).toBe(0);
  });

  it("coerces numeric-string values (as Postgres numeric returns them) to numbers", () => {
    const groups = groupMetricsByName([{ metricName: "cpu_percent", value: "73.500000", recordedAt: t(0) }]);
    expect(groups[0]?.latestValue).toBe(73.5);
  });
});
