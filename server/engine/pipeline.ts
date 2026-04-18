import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "../env";
import { getProjectRoot } from "../paths";
import { getTaskStore } from "../taskStore";
import { calculateBlastRadius } from "./blast-radius";
import { diagnoseBug } from "./diagnose";
import { generateFix } from "./generate";
import { validateFix } from "./validate";
import { createFixPullRequest } from "./github-pr";

export type PipelineJob = {
  id: string;
  error: string;
  file: string;
  stack: string;
  sourceSnippet?: string;
};

async function persistToSupabase(task: PipelineJob, row: Record<string, unknown>) {
  const env = loadEnv();
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_KEY;
  const table = env.SYGNA_SUPABASE_TABLE?.trim() || "sygna_fixes1";
  if (!url || !key || !url.startsWith("http")) return;
  try {
    const supabase = createClient(url, key);
    await supabase.from(table).insert({
      error: task.error,
      file: task.file,
      stack: task.stack,
      ...row,
    });
  } catch (e) {
    console.warn("SYGNA Supabase insert skipped:", e);
  }
}

export async function runPipeline(job: PipelineJob): Promise<void> {
  const store = getTaskStore();
  store.update(job.id, { status: "running", stage: "diagnose" });

  try {
    const diagnosis = await diagnoseBug({
      error: job.error,
      stack: job.stack,
      file: job.file,
      sourceSnippet: job.sourceSnippet,
    });

    const diagnosisText = `${diagnosis.summary}\n${diagnosis.rootCause}`;
    store.update(job.id, { stage: "blastRadius", diagnosis: diagnosisText });

    const projectRoot = getProjectRoot();
    const absFile = path.isAbsolute(job.file)
      ? path.normalize(job.file)
      : path.resolve(projectRoot, job.file);

    const blast = await calculateBlastRadius(
      fs.existsSync(absFile) ? absFile : path.join(projectRoot, "src", "app.js")
    );

    store.update(job.id, { stage: "generate", blast });

    const targetFile = fs.existsSync(absFile)
      ? absFile
      : path.join(projectRoot, "src", "app.js");
    const originalCode = fs.existsSync(targetFile)
      ? fs.readFileSync(targetFile, "utf8")
      : "";

    store.update(job.id, { originalSource: originalCode });

    const fixed = await generateFix({
      filePath: targetFile,
      originalCode,
      diagnosis: diagnosisText,
    });

    store.update(job.id, { stage: "validate", generatedFix: fixed });

    const validation = await validateFix(targetFile, fixed);

    const safe = validation.verdict === "SAFE";
    const mediumOrHigh =
      blast.riskLevel === "Medium" || blast.riskLevel === "High";

    let status: "failed" | "blocked" | "validated";
    if (validation.verdict === "ERROR") {
      status = "failed";
    } else if (!safe) {
      status = "failed";
    } else if (safe && mediumOrHigh) {
      status = "blocked";
    } else {
      status = "validated";
    }

    store.update(job.id, {
      stage: "done",
      validation,
      status,
      generatedFix: fixed,
    });

    let prMeta: {
      htmlUrl?: string;
      prNumber?: number;
      branch?: string;
      prError?: string;
    } = {};

    if (safe && blast.riskLevel === "Low" && validation.verdict !== "ERROR") {
      store.update(job.id, { stage: "github" });
      const pr = await createFixPullRequest({
        absoluteFilePath: targetFile,
        fixedContent: fixed,
        taskId: job.id,
        errorSummary: job.error,
      });
      if (pr.ok) {
        prMeta = {
          htmlUrl: pr.htmlUrl,
          prNumber: pr.number,
          branch: pr.branch,
        };
        store.update(job.id, {
          githubPrUrl: pr.htmlUrl,
          githubPrNumber: pr.number,
          githubBranch: pr.branch,
          stage: "done",
        });
      } else {
        prMeta = { prError: pr.reason };
        store.update(job.id, { githubPrError: pr.reason, stage: "done" });
        console.warn("SYGNA GitHub PR:", pr.reason);
      }
    }

    await persistToSupabase(job, {
      status,
      risk_level: blast.riskLevel,
      risk_score: blast.impactScore,
      blast_radius: blast,
      diagnosis: diagnosisText,
      generated_fix: fixed,
      validation_result: validation,
      github_pr_url: prMeta.htmlUrl,
      github_pr_number: prMeta.prNumber,
      github_pr_error: prMeta.prError,
    });
  } catch (err) {
    console.error("SYGNA pipeline encountered an error:", err);
    store.update(job.id, {
      status: "failed",
      stage: "error",
      generatedFix: err instanceof Error ? err.stack || err.message : String(err)
    });
  }
}
