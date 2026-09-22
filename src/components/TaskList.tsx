"use client";

import { useState } from "react";
import type { Task } from "@/db/schema";

const CONTEXT_LABEL: Record<string, string> = { lilit: "Lilit", sucra: "Ms Sucra", privat: "Privat" };
const PRIO_LABEL: Record<number, string> = { 1: "Jetzt", 2: "Bald", 3: "Irgendwann" };

function fmtDue(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
}

export function TaskList({ tasks, onChange }: { tasks: Task[]; onChange?: () => void }) {
  const [busy, setBusy] = useState<number | null>(null);

  async function toggle(t: Task) {
    setBusy(t.id);
    try {
      await fetch(`/api/tasks/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: t.status === "done" ? "open" : "done" }),
      });
      onChange?.();
    } finally {
      setBusy(null);
    }
  }

  if (tasks.length === 0) return <p className="text-sm text-[var(--muted)]">Keine offenen Aufgaben.</p>;

  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((t) => (
        <li key={t.id} className="card px-3 py-3 flex items-start gap-3">
          <button
            type="button"
            onClick={() => toggle(t)}
            disabled={busy === t.id}
            aria-label={t.status === "done" ? "Wieder öffnen" : "Erledigt"}
            className={`mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center ${
              t.status === "done" ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-fg)]" : "border-[var(--muted)]"
            }`}
          >
            {t.status === "done" ? "✓" : ""}
          </button>
          <div className="flex-1 min-w-0">
            <div className={`text-[15px] leading-snug ${t.status === "done" ? "line-through text-[var(--muted)]" : ""}`}>{t.title}</div>
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-[var(--muted)]">
              <span className={t.priority === 1 ? "text-[var(--accent)] font-medium" : ""}>{PRIO_LABEL[t.priority] ?? t.priority}</span>
              <span>· {CONTEXT_LABEL[t.context] ?? t.context}</span>
              {t.dueDate && <span>· bis {fmtDue(t.dueDate)}</span>}
              {t.person && <span>· {t.person}</span>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
