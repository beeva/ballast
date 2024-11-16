import { describe, expect, it, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { prepareFixtureRepo } from "./prepare-fixture-repo";
import { runBuild } from "./runner";

const FIXTURES_ROOT = path.join(__dirname, "..", "..", "..", "fixtures");

describe("runBuild", () => {
  const tmpDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tmpDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
  });

  async function makeTmpDir(): Promise<string> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ballast-runner-test-"));
    tmpDirs.push(dir);
    return dir;
  }

  it("actually clones and builds a real passing service", async () => {
    const repoDir = await makeTmpDir();
    await prepareFixtureRepo(path.join(FIXTURES_ROOT, "sample-service"), repoDir);

    const workspaceDir = path.join(await makeTmpDir(), "workspace");
    const result = await runBuild({
      repoUrl: repoDir,
      buildCommand: "npm run build",
      workingDirectory: ".",
      workspaceDir,
    });

    expect(result.success).toBe(true);
    expect(result.logs).toContain("sample-service: starting build");
    expect(result.logs).toContain("sample-service: build complete");
    expect(result.durationMs).toBeGreaterThan(0);
    // The runner cleans up its own workspace when done - nothing should linger.
    await expect(fs.access(workspaceDir)).rejects.toThrow();
  }, 30_000);

  it("actually fails on a real failing service, with the real error captured", async () => {
    const repoDir = await makeTmpDir();
    await prepareFixtureRepo(path.join(FIXTURES_ROOT, "failing-service"), repoDir);

    const workspaceDir = path.join(await makeTmpDir(), "workspace");
    const result = await runBuild({
      repoUrl: repoDir,
      buildCommand: "npm run build",
      workingDirectory: ".",
      workspaceDir,
    });

    expect(result.success).toBe(false);
    expect(result.logs).toContain("missing required CONFIG_TOKEN");
    expect(result.errorMessage).toBe("build command exited non-zero");
  }, 30_000);

  it("fails cleanly when the repo doesn't exist, without throwing", async () => {
    const workspaceDir = path.join(await makeTmpDir(), "workspace");
    const result = await runBuild({
      repoUrl: path.join(await makeTmpDir(), "does-not-exist"),
      buildCommand: "npm run build",
      workingDirectory: ".",
      workspaceDir,
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe("git clone failed");
  }, 30_000);

  it("fails when a build command needs a declared env var that isn't passed", async () => {
    const repoDir = await makeTmpDir();
    await prepareFixtureRepo(path.join(FIXTURES_ROOT, "env-var-service"), repoDir);

    const workspaceDir = path.join(await makeTmpDir(), "workspace");
    const result = await runBuild({
      repoUrl: repoDir,
      buildCommand: "npm run build",
      workingDirectory: ".",
      workspaceDir,
    });

    expect(result.success).toBe(false);
    expect(result.logs).toContain("missing required CONFIG_TOKEN");
  }, 30_000);

  it("actually passes declared env vars through to the real build subprocess", async () => {
    const repoDir = await makeTmpDir();
    await prepareFixtureRepo(path.join(FIXTURES_ROOT, "env-var-service"), repoDir);

    const workspaceDir = path.join(await makeTmpDir(), "workspace");
    const result = await runBuild({
      repoUrl: repoDir,
      buildCommand: "npm run build",
      workingDirectory: ".",
      workspaceDir,
      env: { CONFIG_TOKEN: "real-token-from-the-test" },
    });

    expect(result.success).toBe(true);
    expect(result.logs).toContain("CONFIG_TOKEN=real-token-from-the-test");
  }, 30_000);

  it("kills a hung build once the timeout elapses", async () => {
    const repoDir = await makeTmpDir();
    await prepareFixtureRepo(path.join(FIXTURES_ROOT, "sample-service"), repoDir);

    const workspaceDir = path.join(await makeTmpDir(), "workspace");
    const result = await runBuild({
      repoUrl: repoDir,
      // A platform-specific sleep/timeout binary is a trap here: on this
      // Windows sandbox, PATH resolves `timeout` to Git Bash's coreutils
      // version ahead of cmd.exe's builtin, which rejects `/t` and exits
      // near-instantly instead of hanging - silently defeating the whole
      // point of the test. `node` itself is unambiguous everywhere this
      // runs, since the runner requires it anyway.
      buildCommand: `node -e "setInterval(function(){}, 1000)"`,
      workingDirectory: ".",
      workspaceDir,
      timeoutMs: 1000,
    });

    expect(result.success).toBe(false);
    expect(result.logs).toContain("timed out");
  }, 15_000);
});
