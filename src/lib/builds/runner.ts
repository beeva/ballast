import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

export interface RunBuildOptions {
  repoUrl: string;
  buildCommand: string;
  workingDirectory: string;
  /** A directory unique to this build - the runner clones into it and removes it when done. */
  workspaceDir: string;
  /** Hard ceiling on total build time. Real builds can hang; this guarantees the worker doesn't. */
  timeoutMs?: number;
}

export interface BuildResult {
  success: boolean;
  logs: string;
  durationMs: number;
  errorMessage?: string;
}

const DEFAULT_TIMEOUT_MS = 5 * 60_000;

/**
 * Actually clones repoUrl and actually runs buildCommand in a subshell -
 * this is not a simulation. stdout and stderr are captured on the same
 * timeline (one stream of chunks as they arrive, not concatenated
 * separately after the fact) so the log reads in the order a human
 * watching a real terminal would see it.
 */
export async function runBuild(options: RunBuildOptions): Promise<BuildResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const startedAt = Date.now();
  const logLines: string[] = [];

  const log = (line: string) => {
    logLines.push(line);
  };

  try {
    await fs.rm(options.workspaceDir, { recursive: true, force: true });
    await fs.mkdir(options.workspaceDir, { recursive: true });

    log(`$ git clone --depth 1 -- ${options.repoUrl} .`);
    // The `--` stops git from parsing repoUrl as a flag - without it, a
    // repoUrl of e.g. "--upload-pack=..." would be interpreted as an
    // option, not a repository to clone.
    const cloneResult = await runCommand("git", ["clone", "--depth", "1", "--", options.repoUrl, "."], {
      cwd: options.workspaceDir,
      timeoutMs,
    });
    log(cloneResult.output);
    if (!cloneResult.success) {
      return {
        success: false,
        logs: logLines.join(""),
        durationMs: Date.now() - startedAt,
        errorMessage: "git clone failed",
      };
    }

    const buildCwd = path.join(options.workspaceDir, options.workingDirectory);
    log(`$ ${options.buildCommand}`);
    const buildResult = await runShellCommand(options.buildCommand, {
      cwd: buildCwd,
      timeoutMs: timeoutMs - (Date.now() - startedAt),
    });
    log(buildResult.output);

    return {
      success: buildResult.success,
      logs: logLines.join(""),
      durationMs: Date.now() - startedAt,
      errorMessage: buildResult.success ? undefined : "build command exited non-zero",
    };
  } catch (err) {
    log(`\nrunner error: ${err instanceof Error ? err.message : String(err)}\n`);
    return {
      success: false,
      logs: logLines.join(""),
      durationMs: Date.now() - startedAt,
      errorMessage: err instanceof Error ? err.message : "unknown runner error",
    };
  } finally {
    await fs.rm(options.workspaceDir, { recursive: true, force: true }).catch(() => {});
  }
}

interface CommandResult {
  success: boolean;
  output: string;
}

function runCommand(
  command: string,
  args: string[],
  opts: { cwd: string; timeoutMs: number }
): Promise<CommandResult> {
  return new Promise((resolve) => {
    // detached (POSIX only) puts the child in its own process group, so a
    // hung child that spawns its own subprocesses (a credential helper, an
    // npm lifecycle script) can be killed as a whole group instead of just
    // the top-level process, which would otherwise orphan its children.
    const child = spawn(command, args, { cwd: opts.cwd, detached: process.platform !== "win32" });
    collectOutput(child, opts.timeoutMs, resolve);
  });
}

function runShellCommand(command: string, opts: { cwd: string; timeoutMs: number }): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, { cwd: opts.cwd, shell: true, detached: process.platform !== "win32" });
    collectOutput(child, opts.timeoutMs, resolve);
  });
}

/**
 * child.kill() only signals the direct child - with shell:true that's the
 * shell (cmd.exe/sh), not whatever it actually launched, so a killed shell
 * can leave its real child process (npm, node, ...) running and holding
 * files open. Windows has no process groups, so `taskkill /T` walks the OS
 * process tree explicitly; POSIX kills the whole group via the negative pid
 * (only correct because the child was spawned `detached`).
 */
function killProcessTree(child: ReturnType<typeof spawn>) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
  } else {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      child.kill("SIGKILL");
    }
  }
}

function collectOutput(
  child: ReturnType<typeof spawn>,
  timeoutMs: number,
  resolve: (result: CommandResult) => void
) {
  const chunks: string[] = [];
  let settled = false;
  const timer = setTimeout(() => {
    if (settled) return;
    chunks.push(`\n[timed out after ${timeoutMs}ms, killing process]\n`);
    killProcessTree(child);
  }, Math.max(0, timeoutMs));

  child.stdout?.on("data", (chunk: Buffer) => chunks.push(chunk.toString()));
  child.stderr?.on("data", (chunk: Buffer) => chunks.push(chunk.toString()));

  child.on("error", (err) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    chunks.push(`\n[failed to start: ${err.message}]\n`);
    resolve({ success: false, output: chunks.join("") });
  });

  child.on("close", (code) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    resolve({ success: code === 0, output: chunks.join("") });
  });
}
