import { describe, expect, it, vi, beforeEach } from "vitest";
import { builds, services } from "@/lib/db/schema";
import type { Db } from "./process-build";

const runBuildMock = vi.hoisted(() => vi.fn());
vi.mock("./runner", () => ({ runBuild: runBuildMock }));

const { processNextQueuedBuild } = await import("./process-build");

type Call =
  | { op: "select"; table: unknown }
  | { op: "update"; table: unknown; values: Record<string, unknown> };

let calls: Call[] = [];
let queuedBuild: Record<string, unknown> | null = null;
let service: Record<string, unknown> | null = null;

function makeFakeDb(): Db {
  return {
    select: () => ({
      from: (table: unknown) => {
        calls.push({ op: "select", table });
        if (table === builds) {
          return {
            where: () => ({
              orderBy: () => ({
                limit: () => Promise.resolve(queuedBuild ? [queuedBuild] : []),
              }),
            }),
          };
        }
        if (table === services) {
          return { where: () => Promise.resolve(service ? [service] : []) };
        }
        throw new Error("unexpected table in select()");
      },
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: () => {
          calls.push({ op: "update", table, values });
          return Promise.resolve();
        },
      }),
    }),
  } as unknown as Db;
}

describe("processNextQueuedBuild", () => {
  beforeEach(() => {
    calls = [];
    queuedBuild = null;
    service = null;
    runBuildMock.mockReset();
  });

  it("returns processed: false and does no writes when the queue is empty", async () => {
    const result = await processNextQueuedBuild(makeFakeDb(), "/workspaces");
    expect(result).toEqual({ processed: false });
    expect(calls.filter((c) => c.op === "update")).toHaveLength(0);
  });

  it("marks the build running, then success, on a passing build", async () => {
    queuedBuild = { id: "build-1", serviceId: "svc-1" };
    service = {
      id: "svc-1",
      slug: "svc-1-slug",
      repoUrl: "/repo",
      buildCommand: "npm run build",
      workingDirectory: ".",
    };
    runBuildMock.mockResolvedValue({ success: true, logs: "ok", durationMs: 1200 });

    const result = await processNextQueuedBuild(makeFakeDb(), "/workspaces");
    expect(result).toMatchObject({ processed: true, buildId: "build-1", serviceSlug: "svc-1-slug", success: true });

    const updates = calls.filter((c): c is Call & { op: "update" } => c.op === "update");
    expect(updates).toHaveLength(2);
    expect(updates[0]?.values).toMatchObject({ status: "running" });
    expect(updates[1]?.values).toMatchObject({ status: "success", logs: "ok", durationMs: 1200 });

    expect(runBuildMock).toHaveBeenCalledWith(
      expect.objectContaining({ repoUrl: "/repo", buildCommand: "npm run build" })
    );
  });

  it("marks the build failed, with the real error message, on a failing build", async () => {
    queuedBuild = { id: "build-2", serviceId: "svc-1" };
    service = { id: "svc-1", slug: "svc-1-slug", repoUrl: "/repo", buildCommand: "npm run build", workingDirectory: "." };
    runBuildMock.mockResolvedValue({
      success: false,
      logs: "boom",
      durationMs: 400,
      errorMessage: "build command exited non-zero",
    });

    const result = await processNextQueuedBuild(makeFakeDb(), "/workspaces");
    expect(result).toMatchObject({ processed: true, success: false });

    const updates = calls.filter((c): c is Call & { op: "update" } => c.op === "update");
    expect(updates[1]?.values).toMatchObject({
      status: "failed",
      errorMessage: "build command exited non-zero",
    });
  });

  it("fails the build cleanly if its service was deleted, without calling runBuild", async () => {
    queuedBuild = { id: "build-3", serviceId: "deleted-svc" };
    service = null;

    const result = await processNextQueuedBuild(makeFakeDb(), "/workspaces");
    expect(result).toMatchObject({ processed: true, success: false });
    expect(runBuildMock).not.toHaveBeenCalled();

    const updates = calls.filter((c): c is Call & { op: "update" } => c.op === "update");
    expect(updates).toHaveLength(1);
    expect(updates[0]?.values).toMatchObject({ status: "failed" });
  });
});
