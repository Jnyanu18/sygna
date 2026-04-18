import { Check, X, ChevronRight } from "lucide-react";
import type { SygnaTask } from "../types";

const LABELS = [
  "Observe",
  "Diagnose",
  "Blast Radius",
  "Generate",
  "Validate",
  "Complete",
] as const;

type StepState = "pending" | "active" | "done" | "failed" | "gate";

function stepStates(task: SygnaTask): StepState[] {
  const { stage, status, validation } = task;
  const s: StepState[] = [
    "pending",
    "pending",
    "pending",
    "pending",
    "pending",
    "pending",
  ];

  const idx =
    {
      queued: 0,
      diagnose: 1,
      blastRadius: 2,
      generate: 3,
      validate: 4,
      github: 5,
      done: 6,
      denied: 6,
    }[stage] ?? 0;

  for (let i = 0; i < 5; i++) {
    if (idx > i) s[i] = "done";
    else if (idx === i) s[i] = "active";
  }

  if (idx < 5) s[5] = "pending";
  else if (idx === 5) s[5] = "active";
  else {
    if (stage === "denied") s[5] = "failed";
    else if (status === "blocked") s[5] = "gate";
    else if (
      status === "failed" &&
      (validation?.verdict === "ERROR" || validation?.verdict === "BLOCKED")
    ) {
      s[4] = "failed";
      s[5] = "failed";
    } else if (status === "failed") {
      s[5] = "failed";
    } else {
      s[5] = "done";
    }
  }

  return s;
}

function StepBox({ label, state }: { label: string; state: StepState }) {
  const base =
    "flex min-w-[92px] flex-1 flex-col items-center justify-center rounded-lg border px-2 py-3 text-center text-[11px] font-medium leading-tight transition-all";

  if (state === "done") {
    return (
      <div
        className={`${base} border-sygna-green/40 bg-sygna-green/10 text-sygna-green`}
      >
        <Check className="mb-1 size-4" strokeWidth={2.5} />
        {label}
      </div>
    );
  }
  if (state === "active") {
    return (
      <div
        className={`${base} border-purple/60 bg-purple/10 text-purple shadow-stage-active`}
      >
        <div className="mb-1 size-4 animate-pulse rounded-full bg-purple/80" />
        {label}
      </div>
    );
  }
  if (state === "failed") {
    return (
      <div
        className={`${base} border-sygna-red/50 bg-sygna-red/10 text-sygna-red`}
      >
        <X className="mb-1 size-4" strokeWidth={2.5} />
        {label}
      </div>
    );
  }
  if (state === "gate") {
    return (
      <div
        className={`${base} border-sygna-amber/50 bg-sygna-amber/10 text-sygna-amber shadow-[0_0_12px_rgba(245,158,11,0.35)]`}
      >
        <div className="mb-1 size-4 rounded-full border-2 border-sygna-amber" />
        {label}
      </div>
    );
  }
  return (
    <div className={`${base} border-line bg-panel/80 text-sygna-muted`}>
      <div className="mb-1 size-4 rounded-full border border-line" />
      {label}
    </div>
  );
}

export function PipelineView({ task }: { task: SygnaTask }) {
  const states = stepStates(task);

  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sygna-muted">
        Pipeline
      </h3>
      <div className="flex flex-wrap items-stretch gap-1 md:flex-nowrap">
        {LABELS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-0.5">
            <StepBox label={label} state={states[i] ?? "pending"} />
            {i < LABELS.length - 1 && (
              <ChevronRight className="hidden size-4 shrink-0 text-sygna-muted md:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
