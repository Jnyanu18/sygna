import { Clock, FileWarning, GitBranch } from "lucide-react";
import type { SygnaTask } from "../types";

function formatAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export function TaskHeader({ task }: { task: SygnaTask }) {
  return (
    <header className="rounded-xl border border-line bg-panel p-4">
      <div className="mb-2 flex flex-wrap items-start gap-3">
        <FileWarning className="mt-0.5 size-5 shrink-0 text-sygna-amber" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-snug text-sygna-main">
            {task.error || "No error message"}
          </h2>
          <p className="mt-1 truncate font-mono text-xs text-sygna-muted" title={task.file}>
            {task.file}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-xs text-sygna-muted">
          <Clock className="size-3.5" />
          {formatAgo(task.createdAt)}
        </div>
      </div>
      {task.githubPrUrl && task.githubPrNumber != null && (
        <a
          href={task.githubPrUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-purple hover:underline"
        >
          <GitBranch className="size-4" />
          Pull request #{task.githubPrNumber}
        </a>
      )}
    </header>
  );
}
