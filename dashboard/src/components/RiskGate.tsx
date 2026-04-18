import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { BlastData, SygnaTask } from "../types";

type Props = {
  task: SygnaTask;
  blast: BlastData;
  onRefresh: () => void;
};

export function RiskGate({ task, blast, onRefresh }: Props) {
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function approve() {
    setErr(null);
    setLoading("approve");
    try {
      const r = await fetch(`/api/sygna/tasks/${task.id}/approve`, {
        method: "POST",
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error || r.statusText);
      await onRefresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setLoading(null);
    }
  }

  async function deny() {
    setErr(null);
    setLoading("deny");
    try {
      const r = await fetch(`/api/sygna/tasks/${task.id}/deny`, {
        method: "POST",
      });
      if (!r.ok) throw new Error(await r.text());
      await onRefresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Deny failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-xl border border-sygna-amber/40 bg-sygna-amber/5 p-4">
      <div className="mb-3 flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-sygna-amber" />
        <div>
          <p className="text-sm font-semibold text-sygna-amber">
            Medium / High risk — human approval required
          </p>
          <p className="mt-1 text-xs text-sygna-muted">
            Automated tests passed, but blast radius is{" "}
            <strong className="text-sygna-main">{blast.riskLevel}</strong> with
            impact score{" "}
            <strong className="font-mono text-sygna-main">
              {(blast.impactScore * 100).toFixed(0)}%
            </strong>
            .
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading !== null}
          onClick={approve}
          className="rounded-lg bg-sygna-green px-4 py-2 text-sm font-semibold text-app transition hover:brightness-110 disabled:opacity-50"
        >
          {loading === "approve" ? "Opening PR…" : "Approve & create PR"}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={deny}
          className="rounded-lg border-2 border-sygna-red bg-transparent px-4 py-2 text-sm font-semibold text-sygna-red transition hover:bg-sygna-red/10 disabled:opacity-50"
        >
          {loading === "deny" ? "Denying…" : "Deny"}
        </button>
      </div>
      {err && <p className="mt-2 text-sm text-sygna-red">{err}</p>}
    </div>
  );
}
