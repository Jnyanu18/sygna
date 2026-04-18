import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import type { BlastRadiusResult } from "./engine/blast-radius";
import type { ValidateResult } from "./engine/validate";
import { getProjectRoot } from "./paths";

export type SygnaTask = {
  id: string;
  error: string;
  file: string;
  stack: string;
  status: "pending" | "running" | "validated" | "failed" | "blocked";
  stage: string;
  diagnosis: string;
  generatedFix: string;
  originalSource: string;
  blast?: BlastRadiusResult;
  validation?: ValidateResult;
  /** Set when auto-PR succeeds (SAFE + Low risk) or after manual approve */
  githubPrUrl?: string;
  githubPrNumber?: number;
  githubBranch?: string;
  githubPrError?: string;
  createdAt: string;
};

const STORE_FILE = path.join(getProjectRoot(), "sygna-tasks.json");

function loadStore(): Map<string, SygnaTask> {
  if (fs.existsSync(STORE_FILE)) {
    try {
      return new Map(Object.entries(JSON.parse(fs.readFileSync(STORE_FILE, "utf8"))));
    } catch {
      return new Map();
    }
  }
  return new Map();
}

function saveStore(store: Map<string, SygnaTask>) {
  fs.writeFileSync(STORE_FILE, JSON.stringify(Object.fromEntries(store), null, 2), "utf8");
}

const tasks = loadStore();

export function getTaskStore() {
  return {
    create(
      partial: Pick<SygnaTask, "error" | "file" | "stack"> &
        Partial<
          Pick<SygnaTask, "status" | "stage" | "diagnosis" | "generatedFix" | "originalSource">
        >
    ): SygnaTask {
      const id = randomUUID();
      const t: SygnaTask = {
        diagnosis: "",
        generatedFix: "",
        originalSource: "",
        ...partial,
        id,
        status: partial.status ?? "pending",
        stage: partial.stage ?? "queued",
        createdAt: new Date().toISOString(),
      };
      tasks.set(id, t);
      saveStore(tasks);
      return t;
    },
    update(id: string, patch: Partial<SygnaTask>) {
      const cur = tasks.get(id);
      if (!cur) return;
      Object.assign(cur, patch);
      saveStore(tasks);
    },
    get(id: string) {
      return tasks.get(id);
    },
    list() {
      return [...tasks.values()].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      );
    },
  };
}
