import { ExternalLink } from "lucide-react";
import type { ValidationData } from "../types";

export function ValidationResult({
  validation,
  githubPrUrl,
  githubPrNumber,
  githubPrError,
}: {
  validation: ValidationData;
  githubPrUrl?: string;
  githubPrNumber?: number;
  githubPrError?: string;
}) {
  const v = validation.verdict;
  const badge =
    v === "SAFE"
      ? "bg-sygna-green/20 text-sygna-green ring-sygna-green/30"
      : v === "BLOCKED"
        ? "bg-sygna-amber/20 text-sygna-amber ring-sygna-amber/30"
        : "bg-sygna-red/20 text-sygna-red ring-sygna-red/30";

  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sygna-muted">
        Validation
      </h3>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide ring-1 ${badge}`}
        >
          {v}
        </span>
        <span className="text-sm text-sygna-main">
          <span className="font-mono text-sygna-green">
            {validation.testsPassed}
          </span>
          <span className="text-sygna-muted"> passed</span>
          <span className="mx-1 text-sygna-muted">/</span>
          <span className="font-mono text-sygna-red">
            {validation.testsFailed}
          </span>
          <span className="text-sygna-muted"> failed</span>
        </span>
      </div>
      {githubPrUrl && githubPrNumber != null && (
        <a
          href={githubPrUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-purple hover:text-purple-dim"
        >
          View PR #{githubPrNumber}
          <ExternalLink className="size-3.5" />
        </a>
      )}
      {githubPrError && (
        <p className="mt-3 rounded-md border border-sygna-red/30 bg-sygna-red/10 p-2 text-sm text-sygna-red">
          {githubPrError}
        </p>
      )}
    </div>
  );
}
