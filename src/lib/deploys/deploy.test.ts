import { describe, expect, it, beforeEach } from "vitest";
import { builds, deploys, services } from "@/lib/db/schema";
import { deployBuild, type Db } from "./deploy";

type Call =
  | { op: "update"; table: unknown; values: Record<string, unknown> }
  | { op: "insert"; table: unknown; values: Record<string, unknown> };

let calls: Call[] = [];
let service: Record<string, unknown> | null = { id: "svc-1" };
let build: Record<string, unknown> | null = null;
let priorDeploysOfThisBuild: Record<string, unknown>[] = [];
let insertedId = "new-deploy-id";

function makeFakeDb(): Db {
  const db = {
    select: () => ({
      from: (table: unknown) => ({
        where: () => {
          if (table === services) return { for: () => Promise.resolve(service ? [service] : []) };
          if (table === builds) return Promise.resolve(build ? [build] : []);
          if (table === deploys) return Promise.resolve(priorDeploysOfThisBuild);
          throw new Error("unexpected table in select()");
        },
      }),
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: () => {
          calls.push({ op: "update", table, values });
          return Promise.resolve();
        },
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => ({
        returning: () => {
          calls.push({ op: "insert", table, values });
          return Promise.resolve([{ id: insertedId }]);
        },
      }),
    }),
    transaction: (fn: (tx: Db) => Promise<unknown>) => fn(db as unknown as Db),
  };
  return db as unknown as Db;
}

describe("deployBuild", () => {
  beforeEach(() => {
    calls = [];
    service = { id: "svc-1" };
    build = null;
    priorDeploysOfThisBuild = [];
    insertedId = "new-deploy-id";
  });

  it("rejects a service that doesn't exist", async () => {
    service = null;
    const result = await deployBuild(makeFakeDb(), {
      serviceId: "missing-svc",
      buildId: "build-1",
      deployedBy: "admin@example.com",
    });
    expect(result).toEqual({ ok: false, error: "Service not found." });
  });

  it("rejects a build that doesn't exist", async () => {
    const result = await deployBuild(makeFakeDb(), {
      serviceId: "svc-1",
      buildId: "missing",
      deployedBy: "admin@example.com",
    });
    expect(result).toEqual({ ok: false, error: "Build not found." });
  });

  it("rejects a build that belongs to a different service", async () => {
    build = { id: "build-1", serviceId: "svc-other", status: "success" };
    const result = await deployBuild(makeFakeDb(), {
      serviceId: "svc-1",
      buildId: "build-1",
      deployedBy: "admin@example.com",
    });
    expect(result).toEqual({ ok: false, error: "Build does not belong to this service." });
  });

  it("rejects a build that hasn't succeeded", async () => {
    build = { id: "build-1", serviceId: "svc-1", status: "failed" };
    const result = await deployBuild(makeFakeDb(), {
      serviceId: "svc-1",
      buildId: "build-1",
      deployedBy: "admin@example.com",
    });
    expect(result).toEqual({ ok: false, error: 'Cannot deploy a build with status "failed".' });
  });

  it("supersedes the current active deploy and inserts a new one, not a rollback", async () => {
    build = { id: "build-2", serviceId: "svc-1", status: "success" };
    priorDeploysOfThisBuild = []; // this build has never been deployed before

    const result = await deployBuild(makeFakeDb(), {
      serviceId: "svc-1",
      buildId: "build-2",
      deployedBy: "admin@example.com",
    });

    expect(result).toEqual({ ok: true, deployId: "new-deploy-id", isRollback: false });

    const supersede = calls.find((c) => c.op === "update");
    expect(supersede?.values).toMatchObject({ status: "superseded" });

    const insert = calls.find((c) => c.op === "insert");
    expect(insert?.values).toMatchObject({
      serviceId: "svc-1",
      buildId: "build-2",
      status: "active",
      isRollback: false,
      deployedBy: "admin@example.com",
    });
  });

  it("marks isRollback true when the build was already deployed before", async () => {
    build = { id: "build-1", serviceId: "svc-1", status: "success" };
    priorDeploysOfThisBuild = [{ id: "old-deploy", serviceId: "svc-1", buildId: "build-1" }];

    const result = await deployBuild(makeFakeDb(), {
      serviceId: "svc-1",
      buildId: "build-1",
      deployedBy: "admin@example.com",
    });

    expect(result).toMatchObject({ ok: true, isRollback: true });
    const insert = calls.find((c) => c.op === "insert");
    expect(insert?.values).toMatchObject({ isRollback: true });
  });
});
