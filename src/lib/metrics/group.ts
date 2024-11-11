export interface MetricRow {
  metricName: string;
  value: string | number;
  recordedAt: Date;
}

export interface MetricGroup {
  metricName: string;
  latestValue: number;
  latestRecordedAt: Date;
  /** Direction vs the point immediately before latest, null with fewer than 2 points. */
  trend: "up" | "down" | "flat" | null;
  /** Most recent points first, capped to keep the UI list bounded. */
  recentValues: number[];
}

const MAX_RECENT_VALUES_PER_METRIC = 8;

/**
 * Groups metric rows (expected newest-first, as returned by a query ordered
 * by recordedAt desc) by metric name, deriving a trend from the two most
 * recent points per metric. A pure function so the grouping/trend logic is
 * unit-testable without a database.
 */
export function groupMetricsByName(rows: MetricRow[]): MetricGroup[] {
  const byName = new Map<string, MetricRow[]>();
  for (const row of rows) {
    const existing = byName.get(row.metricName);
    if (existing) existing.push(row);
    else byName.set(row.metricName, [row]);
  }

  const groups: MetricGroup[] = [];
  for (const [metricName, metricRows] of byName) {
    const values = metricRows.map((r) => Number(r.value));
    const [latest, previous] = values;
    let trend: MetricGroup["trend"] = null;
    if (latest !== undefined && previous !== undefined) {
      trend = latest > previous ? "up" : latest < previous ? "down" : "flat";
    }
    const first = metricRows[0];
    if (!first || latest === undefined) continue;
    groups.push({
      metricName,
      latestValue: latest,
      latestRecordedAt: first.recordedAt,
      trend,
      recentValues: values.slice(0, MAX_RECENT_VALUES_PER_METRIC),
    });
  }

  return groups.sort((a, b) => a.metricName.localeCompare(b.metricName));
}
