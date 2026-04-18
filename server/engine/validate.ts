import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { getProjectRoot } from "../paths";

export type ValidateResult = {
  passed: boolean;
  testsPassed: number;
  testsFailed: number;
  verdict: "SAFE" | "BLOCKED" | "ERROR";
  raw?: unknown;
  error?: string;
};

function parseVitestJson(stdout: string): {
  numPassed: number;
  numFailed: number;
} | null {
  try {
    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    const numPassed = Number(
      parsed.numPassedTests ?? parsed.numPassed ?? 0
    );
    const numFailed = Number(
      parsed.numFailedTests ?? parsed.numFailed ?? 0
    );
    if (Number.isFinite(numPassed) && Number.isFinite(numFailed)) {
      return { numPassed, numFailed };
    }
  } catch {
    /* fall through */
  }
  return null;
}

/**
 * Writes the fix to the real file path, runs Vitest in a subprocess, then restores the file.
 * This runs your actual test suite against the proposed change (no fake checks).
 */
export async function validateFix(
  filePath: string,
  fixedCode: string
): Promise<ValidateResult> {
  const projectRoot = getProjectRoot();
  const absTarget = path.isAbsolute(filePath)
    ? path.normalize(filePath)
    : path.resolve(projectRoot, filePath);

  if (!fs.existsSync(absTarget)) {
    return {
      passed: false,
      testsPassed: 0,
      testsFailed: 0,
      verdict: "ERROR",
      error: `File not found: ${absTarget}`,
    };
  }

  const backup = fs.readFileSync(absTarget, "utf8");
  try {
    fs.writeFileSync(absTarget, fixedCode, "utf8");

    const proc = spawnSync(
      "npx",
      ["vitest", "run", "--reporter=json"],
      {
        cwd: projectRoot,
        encoding: "utf8",
        maxBuffer: 20 * 1024 * 1024,
        timeout: 120_000,
        env: { ...process.env },
        shell: true,
      }
    );

    const stdout = String(proc.stdout ?? "");
    const stderr = String(proc.stderr ?? "");

    const trimmed = stdout.trim();
    let fullJson: unknown;
    try {
      fullJson = JSON.parse(trimmed);
    } catch {
      fullJson = undefined;
    }

    const parsed = parseVitestJson(trimmed);
    if (!parsed) {
      return {
        passed: false,
        testsPassed: 0,
        testsFailed: 0,
        verdict: "ERROR",
        error:
          stderr ||
          stdout.slice(0, 2000) ||
          `vitest exited with code ${proc.status ?? "unknown"}`,
        raw: { stdout, stderr, status: proc.status },
      };
    }

    const { numPassed, numFailed } = parsed;
    return {
      passed: numFailed === 0,
      testsPassed: numPassed,
      testsFailed: numFailed,
      verdict: numFailed === 0 ? "SAFE" : "BLOCKED",
      raw: fullJson,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      passed: false,
      testsPassed: 0,
      testsFailed: 0,
      verdict: "ERROR",
      error: msg,
    };
  } finally {
    fs.writeFileSync(absTarget, backup, "utf8");
  }
}
