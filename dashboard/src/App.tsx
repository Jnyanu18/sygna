import { useCallback, useEffect, useState } from "react";
import type { SygnaTask } from "./types";
import { TaskSidebar } from "./components/TaskSidebar";
import { TaskDetail } from "./components/TaskDetail";

async function fetchTasks(): Promise<SygnaTask[]> {
  const r = await fetch("/api/sygna/tasks");
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export default function App() {
  const [tasks, setTasks] = useState<SygnaTask[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await fetchTasks();
      setTasks(list);
      setLoadError(null);
      setSelectedId((cur) => {
        if (cur && list.some((t) => t.id === cur)) return cur;
        return list[0]?.id ?? null;
      });
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load tasks");
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [refresh]);

  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-app">
      {loadError && (
        <div className="border-b border-line bg-panel px-4 py-2 text-sm text-sygna-red">
          {loadError}
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        <aside className="w-[280px] shrink-0 border-r border-line bg-panel">
          <TaskSidebar
            tasks={tasks}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </aside>
        <main className="min-w-0 flex-1 overflow-hidden bg-app">
          <TaskDetail task={selected} onRefresh={refresh} />
        </main>
      </div>
    </div>
  );
}
