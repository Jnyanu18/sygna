import { Activity } from "lucide-react";
import type { SygnaTask } from "../types";

function formatAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatusBadge({ status }: { status: SygnaTask["status"] }) {
  const base =
    "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide";
  if (status === "pending" || status === "running") {
    return (
      <span
        className={`${base} bg-sygna-blue/20 text-sygna-blue animate-pulse`}
      >
        <Activity className="size-3" />
        {status}
      </span>
    );
  }
  if (status === "validated") {
    return (
      <span className={`${base} bg-sygna-green/15 text-sygna-green`}>
        validated
      </span>
    );
  }
  if (status === "blocked") {
    return (
      <span className={`${base} bg-sygna-amber/15 text-sygna-amber`}>
        blocked
      </span>
    );
  }
  return (
    <span className={`${base} bg-sygna-red/15 text-sygna-red`}>failed</span>
  );
}

type Props = {
  tasks: SygnaTask[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function TaskSidebar({ tasks, selectedId, onSelect }: Props) {
  if (!tasks.length) {
    return (
      <div className="flex h-full flex-col p-4">
        <div className="mb-4 flex items-center gap-2 border-b border-line pb-3">
          <Activity className="size-4 text-purple" />
          <span className="text-sm font-semibold tracking-tight text-sygna-main">
            Incidents
          </span>
        </div>
        <p className="text-sm leading-relaxed text-sygna-muted">
          Waiting for Sentry crashes…
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line p-4">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-purple" />
          <span className="text-sm font-semibold tracking-tight text-sygna-main">
            Incidents
          </span>
          <span className="ml-auto rounded bg-item px-2 py-0.5 text-xs text-sygna-muted">
            {tasks.length}
          </span>
        </div>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto p-2">
        {tasks.map((t) => {
          const sel = t.id === selectedId;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onSelect(t.id)}
                className={`mb-1 w-full rounded-lg border border-transparent p-3 text-left transition-colors ${
                  sel
                    ? "border-l-[3px] border-l-purple bg-item ring-1 ring-purple/30"
                    : "border-l-[3px] border-l-transparent bg-item/40 hover:bg-item"
                } `}
              >
                <div className="mb-2 line-clamp-2 text-[13px] leading-snug text-sygna-main">
                  {t.error || "(no message)"}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={t.status} />
                  <span className="shrink-0 text-[11px] text-sygna-muted">
                    {formatAgo(t.createdAt)}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
