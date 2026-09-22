"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";

type Settings = { name: string; salutation: string; tonality: string; voiceId: string; notionConnected: boolean };
type Voice = { voiceId: string; name: string; category: string };

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/settings").then(async (r) => r.ok && setS((await r.json()) as Settings));
    void fetch("/api/voices").then(async (r) => r.ok && setVoices((await r.json()) as Voice[]));
  }, []);

  async function save() {
    if (!s) return;
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    setSaving(false);
    setMsg(res.ok ? "Gespeichert." : "Speichern fehlgeschlagen.");
  }

  return (
    <>
      <Header title="Einstellungen" back="/" />
      <main className="flex flex-col gap-5 pt-4">
        {!s && <p className="text-sm text-[var(--muted)]">Lädt…</p>}
        {s && (
          <>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)]">Name</span>
              <input className="input" value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)]">So spricht er dich an</span>
              <input className="input" value={s.salutation} onChange={(e) => setS({ ...s, salutation: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)]">Stimme</span>
              <select className="input" value={s.voiceId} onChange={(e) => setS({ ...s, voiceId: e.target.value })}>
                {voices.length === 0 && <option value={s.voiceId}>{s.voiceId}</option>}
                {voices.map((v) => (
                  <option key={v.voiceId} value={v.voiceId}>{v.name.replace(/^Uebergabe /, "")}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)]">Tonalität (so redet er mit dir)</span>
              <textarea className="input min-h-32" value={s.tonality} onChange={(e) => setS({ ...s, tonality: e.target.value })} />
            </label>
            <button type="button" onClick={save} disabled={saving} className="btn btn-primary">
              {saving ? "Speichert…" : "Speichern"}
            </button>
            {msg && <p className="text-sm text-[var(--muted)]">{msg}</p>}
            <p className="text-xs text-[var(--muted)] pt-4">Notion-Anbindung: {s.notionConnected ? "verbunden" : "kommt in Phase 1b"}.</p>
          </>
        )}
      </main>
    </>
  );
}
