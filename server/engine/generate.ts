import Groq from "groq-sdk";
import { loadEnv } from "../env";

/**
 * Returns fixed source code only (no markdown fences).
 */
export async function generateFix(input: {
  filePath: string;
  originalCode: string;
  diagnosis: string;
}): Promise<string> {
  const env = loadEnv();
  if (!env.GROQ_API_KEY) {
    return input.originalCode;
  }

  const client = new Groq({ apiKey: env.GROQ_API_KEY, timeout: 30000 });

  const prompt = `You output ONLY the full fixed source file contents. No markdown, no backticks, no commentary.

File: ${input.filePath}
Diagnosis: ${input.diagnosis}

Original code:
${input.originalCode.slice(0, 12000)}`;

  const completion = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });

  let out = completion.choices[0]?.message?.content?.trim() ?? "";
  out = out.replace(/^```[a-zA-Z]*\n?/m, "").replace(/\n?```$/m, "");
  return out.trim() || input.originalCode;
}
