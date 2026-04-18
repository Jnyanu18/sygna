import { Braces } from "lucide-react";

function lines(s: string): string[] {
  if (!s) return [""];
  return s.split(/\r?\n/);
}

function LineColumn({ content, title }: { content: string; title: string }) {
  const ls = lines(content);
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-lg border border-line bg-item">
      <div className="border-b border-line bg-panel px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-sygna-muted">
        {title}
      </div>
      <div className="max-h-[400px] overflow-auto font-mono text-[12px] leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {ls.map((line, i) => (
              <tr key={i} className="hover:bg-panel/50">
                <td className="w-10 select-none border-r border-line bg-app/80 px-2 py-0.5 text-right text-sygna-muted">
                  {i + 1}
                </td>
                <td className="whitespace-pre-wrap px-2 py-0.5 text-sygna-main">
                  {line || " "}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CodeDiffViewer({
  filePath,
  original,
  fixed,
}: {
  filePath: string;
  original: string;
  fixed: string;
}) {
  const short = filePath.split(/[/\\]/).pop() ?? filePath;
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-line pb-3">
        <Braces className="size-4 text-purple" />
        <span className="truncate font-mono text-sm text-sygna-main" title={filePath}>
          {short}
        </span>
        <span className="ml-auto truncate text-[11px] text-sygna-muted" title={filePath}>
          {filePath}
        </span>
      </div>
      <div className="flex min-h-0 gap-3">
        <LineColumn content={original} title="Original" />
        <LineColumn content={fixed} title="AI fix" />
      </div>
    </div>
  );
}
