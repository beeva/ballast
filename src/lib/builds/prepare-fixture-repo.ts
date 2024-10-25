import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";

const execFileAsync = promisify(execFile);

/**
 * Copies a fixture's source files into a fresh, real git repository at
 * targetDir. The build runner always does a genuine `git clone` for its
 * checkout step, never a plain file copy - this is what makes that true
 * even for the fixture services committed as plain files in this repo,
 * instead of special-casing "local" sources in the runner itself.
 */
export async function prepareFixtureRepo(sourceDir: string, targetDir: string): Promise<void> {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });
  await fs.cp(sourceDir, targetDir, { recursive: true });

  const git = (args: string[]) => execFileAsync("git", args, { cwd: targetDir });
  await git(["init", "--quiet", "--initial-branch=main"]);
  await git(["config", "user.email", "fixtures@ballast.local"]);
  await git(["config", "user.name", "Ballast Fixtures"]);
  await git(["add", "-A"]);
  await git(["commit", "--quiet", "-m", "Initial fixture commit"]);
}
