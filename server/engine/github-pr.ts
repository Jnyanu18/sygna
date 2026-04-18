import { loadEnv } from "../env";
import { getProjectRoot } from "../paths";
import path from "path";

type GhContentFile = {
  sha: string;
  type: string;
};

function parseRepo(repo: string): { owner: string; name: string } | null {
  const m = repo.trim().match(/^([^/]+)\/([^/]+)$/);
  if (!m) return null;
  return { owner: m[1], name: m[2] };
}

/** GitHub contents API expects each path segment encoded; slashes stay slashes. */
function encodeRepoPath(rel: string): string {
  return rel
    .split("/")
    .filter(Boolean)
    .map((s) => encodeURIComponent(s))
    .join("/");
}

async function ghFetch(
  token: string,
  url: string,
  init?: RequestInit
): Promise<Response> {
  const maxRetries = 3;
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          ...(init?.headers as Record<string, string>),
        },
      });
      return res;
    } catch (e) {
      lastError = e;
      // If it's a network issue / keep-alive socket drop (TypeError: fetch failed), retry
      if (e instanceof Error && e.message === "fetch failed") {
        await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

/**
 * Creates a branch from the default branch, commits the file fix, opens a PR.
 * Uses GitHub REST API only (no Octokit) to keep dependencies minimal.
 */
export async function createFixPullRequest(input: {
  absoluteFilePath: string;
  fixedContent: string;
  taskId: string;
  errorSummary: string;
}): Promise<
  | { ok: true; htmlUrl: string; number: number; branch: string }
  | { ok: false; reason: string }
> {
  const env = loadEnv();
  const token = env.GITHUB_TOKEN;
  const repoStr = env.GITHUB_REPOSITORY;
  const base = env.GITHUB_DEFAULT_BRANCH ?? "main";

  if (!token) {
    return { ok: false, reason: "GITHUB_TOKEN not set" };
  }
  if (!repoStr) {
    return { ok: false, reason: "GITHUB_REPOSITORY not set (owner/repo)" };
  }

  const parsed = parseRepo(repoStr);
  if (!parsed) {
    return { ok: false, reason: "GITHUB_REPOSITORY must be owner/repo" };
  }

  const { owner, name } = parsed;
  const projectRoot = getProjectRoot();
  const abs = path.normalize(input.absoluteFilePath);
  const rel = path.relative(projectRoot, abs).replace(/\\/g, "/");
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return { ok: false, reason: "File path is outside project root" };
  }

  const branch = `sygna-fix-${Date.now()}-${input.taskId.replace(/-/g, "").slice(0, 12)}`;
  const baseUrl = `https://api.github.com/repos/${owner}/${name}`;

  const refRes = await ghFetch(token, `${baseUrl}/git/ref/heads/${encodeURIComponent(base)}`);
  if (!refRes.ok) {
    const t = await refRes.text();
    return { ok: false, reason: `Could not read ref heads/${base}: ${refRes.status} ${t.slice(0, 200)}` };
  }
  const refJson = (await refRes.json()) as { object: { sha: string } };
  const baseSha = refJson.object.sha;

  const createRef = await ghFetch(token, `${baseUrl}/git/refs`, {
    method: "POST",
    body: JSON.stringify({
      ref: `refs/heads/${branch}`,
      sha: baseSha,
    }),
  });
  if (!createRef.ok) {
    const t = await createRef.text();
    return { ok: false, reason: `Create branch failed: ${createRef.status} ${t.slice(0, 300)}` };
  }

  const contentB64 = Buffer.from(input.fixedContent, "utf8").toString("base64");

  const getFile = await ghFetch(
    token,
    `${baseUrl}/contents/${encodeRepoPath(rel)}?ref=${encodeURIComponent(branch)}`
  );
  let fileSha: string | undefined;
  if (getFile.ok) {
    const fileJson = (await getFile.json()) as GhContentFile;
    if (fileJson.type === "file" && fileJson.sha) {
      fileSha = fileJson.sha;
    }
  }

  const putBody: Record<string, string> = {
    message: `fix(sygna): automated fix for ${rel}`,
    content: contentB64,
    branch,
  };
  if (fileSha) putBody.sha = fileSha;

  const put = await ghFetch(token, `${baseUrl}/contents/${encodeRepoPath(rel)}`, {
    method: "PUT",
    body: JSON.stringify(putBody),
  });
  if (!put.ok) {
    const t = await put.text();
    return { ok: false, reason: `Commit file failed: ${put.status} ${t.slice(0, 400)}` };
  }

  const prBody = [
    `**SYGNA automated PR**`,
    ``,
    `Task: \`${input.taskId}\``,
    `Error: ${input.errorSummary.slice(0, 500)}`,
    ``,
    `File: \`${rel}\``,
  ].join("\n");

  const prRes = await ghFetch(token, `${baseUrl}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title: `SYGNA: fix ${rel}`,
      head: branch,
      base,
      body: prBody,
    }),
  });
  if (!prRes.ok) {
    const t = await prRes.text();
    return { ok: false, reason: `Open PR failed: ${prRes.status} ${t.slice(0, 400)}` };
  }

  const pr = (await prRes.json()) as { html_url: string; number: number };
  return {
    ok: true,
    htmlUrl: pr.html_url,
    number: pr.number,
    branch,
  };
}
