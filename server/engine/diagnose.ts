import Groq from "groq-sdk";
import { loadEnv } from "../env";

export type Diagnosis = {
  summary: string;
  rootCause: string;
  suggestedFile?: string;
};

export async function diagnoseBug(input: {
  error: string;
  stack: string;
  file: string;
  sourceSnippet?: string;
}): Promise<Diagnosis> {
  const env = loadEnv();
  if (!env.GROQ_API_KEY) {
    return {
      summary: "Groq API key not configured (GROQ_API_KEY).",
      rootCause: "unknown",
      suggestedFile: input.file,
    };
  }

  const client = new Groq({ apiKey: env.GROQ_API_KEY, timeout: 30000 });

  const prompt = `You are an expert debugger. Given an error, stack, and file path, respond with JSON only:
{"summary":"string","rootCause":"string","suggestedFile":"string"}

Error: ${input.error}
File: ${input.file}
Stack:
${input.stack}
${input.sourceSnippet ? `Source excerpt:\n${input.sourceSnippet.slice(0, 4000)}` : ""}`;

  const completion = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as Diagnosis;
      return {
        summary: parsed.summary || text,
        rootCause: parsed.rootCause || "unknown",
        suggestedFile: parsed.suggestedFile || input.file,
      };
    }
  } catch {
    /* fall through */
  }

  return {
    summary: text || "No diagnosis text returned.",
    rootCause: "unknown",
    suggestedFile: input.file,
  };
}
