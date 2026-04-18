import path from "path";
import {
  ModuleKind,
  ModuleResolutionKind,
  Project,
  ScriptTarget,
  SourceFile,
} from "ts-morph";
import { getProjectRoot } from "../paths";

export type BlastRadiusResult = {
  affectedFiles: string[];
  criticalPaths: string[];
  impactScore: number;
  riskLevel: "Low" | "Medium" | "High";
};

/**
 * Real AST-based blast radius: finds transitive importers of the changed file
 * using ts-morph (import/export graph), not string keyword matching.
 */
export async function calculateBlastRadius(
  changedFile: string
): Promise<BlastRadiusResult> {
  const projectRoot = getProjectRoot();
  const absChanged = path.isAbsolute(changedFile)
    ? path.normalize(changedFile)
    : path.resolve(projectRoot, changedFile);

  const project = new Project({
    compilerOptions: {
      allowJs: true,
      target: ScriptTarget.ES2022,
      module: ModuleKind.CommonJS,
      moduleResolution: ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
    },
    skipAddingFilesFromTsConfig: true,
  });

  project.addSourceFilesAtPaths([
    path.join(projectRoot, "src/**/*.js"),
    path.join(projectRoot, "src/**/*.ts"),
    path.join(projectRoot, "server/**/*.ts"),
  ]);

  const changedSf = project.getSourceFile(absChanged);
  if (!changedSf) {
    return {
      affectedFiles: [],
      criticalPaths: [],
      impactScore: 0,
      riskLevel: "Low",
    };
  }

  const affected = collectTransitiveReferencers(changedSf);
  const affectedFiles = [...new Set(affected.map((f) => f.getFilePath()))];

  const criticalPaths = [
    ...new Set(
      affected.map(
        (f) => `${path.basename(absChanged)} → ${path.basename(f.getFilePath())}`
      )
    ),
  ];

  const impactScore = Math.min(affectedFiles.length * 0.12, 1);
  const riskLevel: BlastRadiusResult["riskLevel"] =
    impactScore > 0.7 ? "High" : impactScore > 0.4 ? "Medium" : "Low";

  return {
    affectedFiles,
    criticalPaths,
    impactScore,
    riskLevel,
  };
}

function collectTransitiveReferencers(start: SourceFile): SourceFile[] {
  const seen = new Set<string>();
  const result: SourceFile[] = [];
  let frontier: SourceFile[] = [start];

  while (frontier.length) {
    const next: SourceFile[] = [];
    for (const f of frontier) {
      for (const ref of f.getReferencingSourceFiles()) {
        const p = ref.getFilePath();
        if (seen.has(p)) continue;
        seen.add(p);
        result.push(ref);
        next.push(ref);
      }
    }
    frontier = next;
  }

  return result;
}
