import { Sparkles } from "lucide-react";

export function DiagnosisPanel({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sygna-muted">
        <Sparkles className="size-3.5 text-purple" />
        Diagnosis
      </h3>
      <div className="rounded-lg border border-line bg-item p-4 text-sm leading-relaxed text-sygna-main whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
}
