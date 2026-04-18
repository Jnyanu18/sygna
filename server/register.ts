import express, { type Application } from "express";
import fs from "fs";
import path from "path";
import type { ObservedIncident } from "./engine/observe";
import { observeHandler } from "./engine/observe";
import { createFixPullRequest } from "./engine/github-pr";
import type { PipelineJob } from "./engine/pipeline";
import { runPipeline } from "./engine/pipeline";
import { getProjectRoot } from "./paths";
import { initPipelineQueue, getPipelineQueue } from "./queue/pipeline.queue";
import { getTaskStore } from "./taskStore";

export function registerSygnaRoutes(app: Application) {
  initPipelineQueue();
  const store = getTaskStore();

  app.use(
    "/sygna-static",
    express.static(path.join(__dirname, "..", "public"))
  );

  async function enqueue(incident: ObservedIncident): Promise<string> {
    const task = store.create({
      error: incident.error,
      file: incident.file,
      stack: incident.stack,
      status: "pending",
      stage: "queued",
    });

    const job: PipelineJob = {
      id: task.id,
      error: incident.error,
      file: incident.file,
      stack: incident.stack,
      sourceSnippet: incident.sourceSnippet,
    };

    const q = getPipelineQueue();
    if (q) {
      await q.add("pipeline", job, { removeOnComplete: true });
    } else {
      setImmediate(() => {
        runPipeline(job).catch((err) =>
          console.error("SYGNA pipeline failed:", err)
        );
      });
    }

    return task.id;
  }

  app.post("/api/sentry-webhook", observeHandler(enqueue));

  app.get("/api/sygna/tasks", (_req, res) => {
    res.json(store.list());
  });

  app.get("/api/sygna/tasks/:id", (req, res) => {
    const t = store.get(req.params.id);
    if (!t) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.json(t);
  });

  /** Medium/High risk: open a PR using the stored fix (requires GITHUB_* env). */
  app.post("/api/sygna/tasks/:id/approve", async (req, res) => {
    try {
      const t = store.get(req.params.id);
      if (!t) {
        res.status(404).json({ error: "not found" });
        return;
      }
      if (t.status !== "blocked") {
        res.status(400).json({ error: "Task is not awaiting approval" });
        return;
      }
      if (!t.generatedFix?.trim()) {
        res.status(400).json({ error: "No generated fix stored" });
        return;
      }
      const projectRoot = getProjectRoot();
      const absFile = path.isAbsolute(t.file)
        ? path.normalize(t.file)
        : path.resolve(projectRoot, t.file);
      if (!fs.existsSync(absFile)) {
        res.status(400).json({ error: "Target file missing on disk" });
        return;
      }
      const pr = await createFixPullRequest({
        absoluteFilePath: absFile,
        fixedContent: t.generatedFix,
        taskId: t.id,
        errorSummary: t.error,
      });
      if (!pr.ok) {
        res.status(502).json({ error: pr.reason });
        return;
      }
      store.update(t.id, {
        status: "validated",
        githubPrUrl: pr.htmlUrl,
        githubPrNumber: pr.number,
        githubBranch: pr.branch,
        githubPrError: undefined,
      });
      res.json({ ok: true, prUrl: pr.htmlUrl, number: pr.number });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ error: msg });
    }
  });

  app.post("/api/sygna/tasks/:id/deny", (req, res) => {
    const t = store.get(req.params.id);
    if (!t) {
      res.status(404).json({ error: "not found" });
      return;
    }
    if (t.status !== "blocked") {
      res.status(400).json({ error: "Task is not awaiting approval" });
      return;
    }
    store.update(t.id, { status: "failed", stage: "denied" });
    res.json({ ok: true });
  });

  const dashboardDir = path.join(__dirname, "..", "public", "dashboard");

  // Serve static assets under /dashboard/
  app.use(
    "/dashboard",
    express.static(dashboardDir, { index: "index.html" })
  );

  // SPA fallback: any /dashboard/* that didn't match a static file → index.html
  app.get("/dashboard/*", (_req, res) => {
    res.sendFile(path.join(dashboardDir, "index.html"));
  });

  app.get("/sygna", (_req, res) => {
    res.redirect(302, "/dashboard/");
  });
}
