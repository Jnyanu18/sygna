import { FileCode, Route } from "lucide-react";
import type { BlastData } from "../types";

export function BlastRadiusPanel({ blast }: { blast: BlastData }) {
  const risk = blast.riskLevel;
  const riskClass =
    risk === "High"
      ? "bg-sygna-red/20 text-sygna-red ring-sygna-red/40"
      : risk === "Medium"
        ? "bg-sygna-amber/20 text-sygna-amber ring-sygna-amber/40"
        : "bg-sygna-green/20 text-sygna-green ring-sygna-green/40";

  const pct = Math.round(Math.min(1, Math.max(0, blast.impactScore)) * 100);

  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-sygna-muted">
        Blast Radius Analysis
      </h3>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span
          className={`rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-wide ring-1 ${riskClass}`}
        >
          {risk} risk
        </span>
        <div className="min-w-[180px] flex-1">
          <div className="mb-1 flex justify-between text-[11px] text-sygna-muted">
            <span>Impact score</span>
            <span className="font-mono text-sygna-main">{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-item">
            <div
              className="h-full rounded-full bg-purple transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
      <div className="mb-4">
        <h4 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase text-sygna-muted">
          <FileCode className="size-3.5" />
          Affected files
        </h4>
        <div className="flex flex-wrap gap-2">
          {(blast.affectedFiles ?? []).length ? (
            blast.affectedFiles.map((f) => (
              <span
                key={f}
                className="inline-flex max-w-full items-center gap-1.5 truncate rounded-md border border-line bg-item px-2.5 py-1 font-mono text-[11px] text-sygna-main"
              >
                <FileCode className="size-3 shrink-0 text-sygna-muted" />
                {f.split(/[/\\]/).pop() ?? f}
              </span>
            ))
          ) : (
            <span className="text-sm text-sygna-muted">No importers found.</span>
          )}
        </div>
      </div>
      <div>
        <h4 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase text-sygna-muted">
          <Route className="size-3.5" />
          Critical paths
        </h4>
        <ul className="space-y-1.5">
          {(blast.criticalPaths ?? []).length ? (
            blast.criticalPaths.map((p) => (
              <li
                key={p}
                className="rounded-md border border-line bg-item/80 px-3 py-2 font-mono text-[11px] text-sygna-main"
              >
                {p}
              </li>
            ))
          ) : (
            <li className="text-sm text-sygna-muted">No paths computed.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
