import { describe, expect, it, beforeEach } from "vitest";
import { ingestMetrics, type Db } from "./ingest";

let insertedRows: Array<Record<string, unknown>> = [];
let knownServices: Record<string, string>; // slug -> id

function makeFakeDb(): Db {
  return {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(Object.entries(knownServices).map(([slug, id]) => ({ slug, id }))),
      }),
    }),
    insert: () => ({
      values: (rows: Array<Record<string, unknown>>) => {
        insertedRows.push(...rows);
        return Promise.resolve();
      },
    }),
  } as unknown as Db;
}

describe("ingestMetrics", () => {
  beforeEach(() => {
    insertedRows = [];
    knownServices = { "sample-service": "svc-1" };
  });

  it("inserts a single point for a known service", async () => {
    const result = await ingestMetrics(makeFakeDb(), {
      serviceSlug: "sample-service",
      metricName: "latency_ms",
      value: 120,
    });
    expect(result).toEqual({ ok: true, inserted: 1 });
    expect(insertedRows).toEqual([{ serviceId: "svc-1", metricName: "latency_ms", value: "120" }]);
  });

  it("inserts a batch of points for the same known service", async () => {
    const result = await ingestMetrics(makeFakeDb(), [
      { serviceSlug: "sample-service", metricName: "latency_ms", value: 100 },
      { serviceSlug: "sample-service", metricName: "error_rate", value: 0.5 },
    ]);
    expect(result).toEqual({ ok: true, inserted: 2 });
    expect(insertedRows).toHaveLength(2);
  });

  it("resolves a batch spanning multiple known services in one lookup", async () => {
    knownServices = { "sample-service": "svc-1", "other-service": "svc-2" };
    const result = await ingestMetrics(makeFakeDb(), [
      { serviceSlug: "sample-service", metricName: "latency_ms", value: 100 },
      { serviceSlug: "other-service", metricName: "latency_ms", value: 200 },
    ]);
    expect(result).toEqual({ ok: true, inserted: 2 });
    expect(insertedRows).toEqual(
      expect.arrayContaining([
        { serviceId: "svc-1", metricName: "latency_ms", value: "100" },
        { serviceId: "svc-2", metricName: "latency_ms", value: "200" },
      ])
    );
  });

  it("fails the whole batch on an unknown service slug rather than dropping just that point", async () => {
    const result = await ingestMetrics(makeFakeDb(), {
      serviceSlug: "totally-unknown-service",
      metricName: "latency_ms",
      value: 100,
    });
    expect(result).toEqual({ ok: false, error: 'Unknown service slug: "totally-unknown-service"' });
    expect(insertedRows).toHaveLength(0);
  });

  it("fails the whole batch if any single point in it has an unknown slug", async () => {
    const result = await ingestMetrics(makeFakeDb(), [
      { serviceSlug: "sample-service", metricName: "latency_ms", value: 100 },
      { serviceSlug: "unknown-one", metricName: "latency_ms", value: 100 },
    ]);
    expect(result).toEqual({ ok: false, error: 'Unknown service slug: "unknown-one"' });
    expect(insertedRows).toHaveLength(0);
  });
});
