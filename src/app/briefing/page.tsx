"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Player } from "@/components/Player";
import { TaskList } from "@/components/TaskList";
import type { AppState } from "@/lib/state";

export default function BriefingPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [showText, setShowText] = useState(false);

  const load = useCallback(() => {
    return fetch("/api/state", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<AppState>) : null))
      .then((next) => {
        if (next) setState(next);
      });
  }, []);

  useEffect(() => { void load(); }, [load]);

  const b = state?.latestBriefing ?? null;

  return (
    <>
      <Header title="Dein Briefing" back="/" />
      <main className="flex-1 flex flex-col gap-6 pt-4">
        {!state && <p className="text-sm text-[var(--muted)]">Lädt…</p>}
        {state && !b && <p className="text-sm text-[var(--muted)]">Noch kein Briefing. Sprich etwas ein und tipp auf „Ich bin zurück“.</p>}
        {b && (
          <>
            <p className="text-xs text-[var(--muted)]">
              {new Date(b.createdAt).toLocaleString("de-DE", { weekday: "long", hour: "2-digit", minute: "2-digit" })}
            </p>
            {b.audioPath ? <Player src={b.audioPath} /> : <p className="text-sm text-[var(--danger)]">Audio fehlt, hier der Text.</p>}
            <button type="button" onClick={() => setShowText((s) => !s)} className="text-sm text-[var(--muted)] underline self-start">
              {showText ? "Text ausblenden" : "Text anzeigen"}
            </button>
            {(showText || !b.audioPath) && <p className="text-[15px] leading-relaxed whitespace-pre-line">{b.script}</p>}
          </>
        )}
        {state && (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-[var(--muted)]">Offene Aufgaben</h2>
            <TaskList tasks={state.openTasks} onChange={load} />
          </section>
        )}
      </main>
    </>
  );
}
