import { describe, expect, it, afterEach } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { prepareFixtureRepo } from "./prepare-fixture-repo";

const execFileAsync = promisify(execFile);

describe("prepareFixtureRepo", () => {
  const tmpDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tmpDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
  });

  async function makeTmpDir(): Promise<string> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ballast-fixture-test-"));
    tmpDirs.push(dir);
    return dir;
  }

  it("turns a plain source directory into a real, clonable git repo", async () => {
    const sourceDir = await makeTmpDir();
    await fs.writeFile(path.join(sourceDir, "package.json"), JSON.stringify({ name: "test-fixture" }));

    const targetDir = await makeTmpDir();
    await prepareFixtureRepo(sourceDir, targetDir);

    const gitDirStat = await fs.stat(path.join(targetDir, ".git"));
    expect(gitDirStat.isDirectory()).toBe(true);

    const { stdout: log } = await execFileAsync("git", ["log", "--oneline"], { cwd: targetDir });
    expect(log.trim().split("\n")).toHaveLength(1);

    const copiedContent = await fs.readFile(path.join(targetDir, "package.json"), "utf8");
    expect(JSON.parse(copiedContent)).toEqual({ name: "test-fixture" });
  });

  it("is genuinely clonable via a real git clone", async () => {
    const sourceDir = await makeTmpDir();
    await fs.writeFile(path.join(sourceDir, "build.js"), "console.log('hi')");

    const repoDir = await makeTmpDir();
    await prepareFixtureRepo(sourceDir, repoDir);

    const cloneDir = path.join(await makeTmpDir(), "clone");
    await execFileAsync("git", ["clone", "--quiet", repoDir, cloneDir]);

    const clonedContent = await fs.readFile(path.join(cloneDir, "build.js"), "utf8");
    expect(clonedContent).toBe("console.log('hi')");
  });

  it("overwrites a stale target directory rather than merging with it", async () => {
    const sourceDir = await makeTmpDir();
    await fs.writeFile(path.join(sourceDir, "current.txt"), "current");

    const targetDir = await makeTmpDir();
    await fs.writeFile(path.join(targetDir, "stale.txt"), "should be gone");

    await prepareFixtureRepo(sourceDir, targetDir);

    await expect(fs.access(path.join(targetDir, "stale.txt"))).rejects.toThrow();
    const currentContent = await fs.readFile(path.join(targetDir, "current.txt"), "utf8");
    expect(currentContent).toBe("current");
  });
});
