import { Inbox } from "lucide-react";
import type { SygnaTask } from "../types";
import { TaskHeader } from "./TaskHeader";
import { PipelineView } from "./PipelineView";
import { RiskGate } from "./RiskGate";
import { BlastRadiusPanel } from "./BlastRadiusPanel";
import { ValidationResult } from "./ValidationResult";
import { CodeDiffViewer } from "./CodeDiffViewer";
import { DiagnosisPanel } from "./DiagnosisPanel";

type Props = {
  task: SygnaTask | null;
  onRefresh: () => void;
};

export function TaskDetail({ task, onRefresh }: Props) {
  if (!task) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-sygna-muted">
        <Inbox className="size-10 opacity-40" />
        <p className="text-sm">Select an incident from the list.</p>
      </div>
    );
  }

  const hasFix =
    Boolean(task.generatedFix?.trim()) || Boolean(task.originalSource?.trim());

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <TaskHeader task={task} />
        <PipelineView task={task} />
        {task.status === "blocked" && task.blast && (
          <RiskGate task={task} blast={task.blast} onRefresh={onRefresh} />
        )}
        {task.blast && <BlastRadiusPanel blast={task.blast} />}
        {task.validation && (
          <ValidationResult
            validation={task.validation}
            githubPrUrl={task.githubPrUrl}
            githubPrNumber={task.githubPrNumber}
            githubPrError={task.githubPrError}
          />
        )}
        {hasFix && (
          <CodeDiffViewer
            filePath={task.file}
            original={task.originalSource ?? ""}
            fixed={task.generatedFix ?? ""}
          />
        )}
        <DiagnosisPanel text={task.diagnosis} />
      </div>
    </div>
  );
}
