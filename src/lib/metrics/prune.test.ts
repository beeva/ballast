import { describe, expect, it } from "vitest";
import { countMetricsOlderThan, pruneMetricsOlderThan, type Db } from "./prune";

function makeFakeDb(rows: Array<{ id: string }>) {
  const db = {
    delete: () => ({
      where: () => ({
        returning: () => Promise.resolve(rows),
      }),
    }),
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(rows),
      }),
    }),
  } as unknown as Db;
  return db;
}

describe("pruneMetricsOlderThan", () => {
  it("returns the count of rows actually deleted and the cutoff used", async () => {
    const db = makeFakeDb([{ id: "1" }, { id: "2" }, { id: "3" }]);
    const cutoff = new Date("2024-01-01T00:00:00Z");
    const result = await pruneMetricsOlderThan(db, cutoff);
    expect(result).toEqual({ deletedCount: 3, cutoff });
  });

  it("returns zero when nothing matches", async () => {
    const db = makeFakeDb([]);
    const result = await pruneMetricsOlderThan(db, new Date());
    expect(result.deletedCount).toBe(0);
  });
});

describe("countMetricsOlderThan", () => {
  it("counts without deleting", async () => {
    const db = makeFakeDb([{ id: "1" }, { id: "2" }]);
    const count = await countMetricsOlderThan(db, new Date());
    expect(count).toBe(2);
  });
});
