import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const schema = z.object({
  SENTRY_DSN: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
  REDIS_URL: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  /** Prefer `service_role` for server inserts; `anon` only works if RLS allows inserts on your table. */
  SUPABASE_SERVICE_KEY: z.string().optional(),
  /** Defaults to `sygna_fixes1` if unset. */
  SYGNA_SUPABASE_TABLE: z.string().optional(),
  SYGNA_PROJECT_ROOT: z.string().optional(),
  /** Fine-grained or classic PAT with `contents` + `pull_requests` on the repo */
  GITHUB_TOKEN: z.string().optional(),
  /** e.g. Jnyanu18/sygna */
  GITHUB_REPOSITORY: z.string().optional(),
  GITHUB_DEFAULT_BRANCH: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.warn("SYGNA env validation warnings:", parsed.error.flatten());
    return schema.parse({});
  }
  return parsed.data;
}
