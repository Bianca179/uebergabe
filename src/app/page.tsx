"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Recorder } from "@/components/Recorder";
import type { AppState } from "@/lib/state";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export default function StartPage() {
  const router = useRouter();
  const [state, setState] = useState<AppState | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return fetch("/api/state", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<AppState>) : null))
      .then((next) => {
        if (next) setState(next);
      });
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/briefings", { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? `Fehler ${res.status}`);
      router.push("/briefing");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setGenerating(false);
    }
  }

  const recs = state?.recordings ?? [];
  const open = state?.openTasks.length ?? 0;

  return (
    <>
      <Header title="Übergabe" />
      <main className="flex-1 flex flex-col gap-8 pt-6">
        <section className="flex flex-col items-center gap-2">
          <p className="text-[var(--muted)] text-sm text-center">
            Was ist offen, bevor du gehst?
          </p>
          <Recorder onUploaded={load} />
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-[var(--muted)]">
            {recs.length === 0 ? "Noch nichts eingesprochen" : `${recs.length} Aufnahme${recs.length === 1 ? "" : "n"} gesammelt`}
          </h2>
          {recs.map((r) => (
            <div key={r.id} className="card px-3 py-2 text-sm">
              <div className="text-xs text-[var(--muted)]">
                {fmtTime(r.createdAt)}{r.durationS ? ` · ${Math.round(r.durationS)} s` : ""}
              </div>
              <div className="line-clamp-2 mt-0.5">{r.transcript || <span className="text-[var(--muted)]">Transkript fehlt</span>}</div>
            </div>
          ))}
        </section>

        <section className="mt-auto flex flex-col gap-3">
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button type="button" onClick={generate} disabled={generating || !state} className="btn btn-primary w-full text-base">
            {generating ? "Er sortiert gerade…" : "Ich bin zurück"}
          </button>
          <div className="flex justify-between text-sm text-[var(--muted)]">
            <span>{open} offene Aufgabe{open === 1 ? "" : "n"}</span>
            {state?.latestBriefing && <Link href="/briefing" className="underline">Letztes Briefing</Link>}
          </div>
        </section>
      </main>
    </>
  );
}
