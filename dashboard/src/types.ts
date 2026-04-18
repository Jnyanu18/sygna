export type TaskStatus = "pending" | "running" | "validated" | "blocked" | "failed";

export type BlastData = {
  affectedFiles: string[];
  criticalPaths: string[];
  impactScore: number;
  riskLevel: "Low" | "Medium" | "High";
};

export type ValidationData = {
  passed: boolean;
  testsPassed: number;
  testsFailed: number;
  verdict: "SAFE" | "BLOCKED" | "ERROR";
};

export type SygnaTask = {
  id: string;
  status: TaskStatus;
  stage: string;
  error: string;
  file: string;
  stack?: string;
  diagnosis: string;
  generatedFix: string;
  originalSource: string;
  blast?: BlastData;
  validation?: ValidationData;
  githubPrUrl?: string;
  githubPrNumber?: number;
  githubPrError?: string;
  githubBranch?: string;
  createdAt: string;
};
