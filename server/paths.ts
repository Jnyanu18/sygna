import path from "path";

/** Repo root (where package.json lives). */
export function getProjectRoot(): string {
  const fromEnv = process.env.SYGNA_PROJECT_ROOT;
  if (fromEnv) return path.resolve(fromEnv);
  return path.resolve(__dirname, "..");
}
