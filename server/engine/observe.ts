import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { getProjectRoot } from "../paths";

export type ObservedIncident = {
  error: string;
  file: string;
  stack: string;
  sourceSnippet?: string;
};

/**
 * Normalize Sentry / manual webhook bodies into a single incident shape.
 */
export function parseSentryPayload(body: unknown): ObservedIncident {
  const b = (body ?? {}) as Record<string, unknown>;
  const event = (b.event ?? b.data ?? b) as Record<string, unknown>;

  const exMsg = (
    event as { exception?: { values?: { value?: string }[] } }
  ).exception?.values?.[0]?.value;

  const message = String(
    event.message ?? event.title ?? b.message ?? exMsg ?? "unknown error"
  );

  let culprit = String(
    event.culprit ?? event.transaction ?? b.culprit ?? b.transaction ?? ""
  );

  let stack = "";
  const ex = event.exception as
    | { values?: Array<{ stacktrace?: unknown; value?: string }> }
    | undefined;
  if (ex?.values?.[0]) {
    const first = ex.values[0];
    stack = String(first.stacktrace ?? first.value ?? "");
  }
  if (!stack) {
    stack = String(event.stacktrace ?? b.stacktrace ?? b.stack ?? "");
  }

  const projectRoot = getProjectRoot();
  let file = String(b.broken_file || culprit || "");
  if (!file && stack) {
    const m = stack.match(/\((.+?):\d+:\d+\)/) || stack.match(/at\s+(.+?):\d+:\d+/);
    if (m) file = m[1].trim();
  }
  if (file && !path.isAbsolute(file)) {
    file = path.resolve(projectRoot, file.replace(/^\//, ""));
  }

  let sourceSnippet: string | undefined;
  if (file && fs.existsSync(file)) {
    try {
      sourceSnippet = fs.readFileSync(file, "utf8");
    } catch {
      sourceSnippet = undefined;
    }
  }

  return {
    error: message,
    file: file || path.join(projectRoot, "src", "app.js"),
    stack: stack || message,
    sourceSnippet,
  };
}

export function observeHandler(
  enqueue: (incident: ObservedIncident) => Promise<string>
) {
  return async (req: Request, res: Response) => {
    try {
      const incident = parseSentryPayload(req.body);
      const id = await enqueue(incident);
      res.status(202).json({ received: true, taskId: id });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ received: false, error: msg });
    }
  };
}
