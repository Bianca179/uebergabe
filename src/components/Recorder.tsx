"use client";

import { useEffect, useRef, useState } from "react";

type Props = { onUploaded: () => void };

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return "";
}

export function Recorder({ onUploaded }: Props) {
  const [state, setState] = useState<"idle" | "recording" | "uploading" | "error">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || mime || "audio/webm" });
        const duration = (Date.now() - startRef.current) / 1000;
        await upload(blob, duration);
      };
      rec.start(1000);
      recRef.current = rec;
      // Event handler, not render: reading the clock here is fine.
      // eslint-disable-next-line react-hooks/purity
      startRef.current = Date.now();
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(Math.floor((Date.now() - startRef.current) / 1000)), 500);
      setState("recording");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mikrofon nicht verfügbar");
      setState("error");
    }
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current);
    recRef.current?.stop();
    setState("uploading");
  }

  async function upload(blob: Blob, duration: number) {
    const form = new FormData();
    form.append("audio", blob, "aufnahme");
    form.append("duration", String(duration));
    try {
      const res = await fetch("/api/recordings", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Upload fehlgeschlagen (${res.status})`);
      const json = (await res.json()) as { transcriptError?: string | null };
      if (json.transcriptError) setError(`Gespeichert, aber Transkription fehlgeschlagen: ${json.transcriptError}`);
      setState("idle");
      onUploaded();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setState("error");
    }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={state === "recording" ? stop : start}
        disabled={state === "uploading"}
        aria-label={state === "recording" ? "Aufnahme stoppen" : "Aufnahme starten"}
        className={`h-36 w-36 rounded-full flex items-center justify-center text-lg font-semibold transition-colors ${
          state === "recording" ? "bg-[var(--danger)] text-white recording" : "bg-[var(--accent)] text-[var(--accent-fg)]"
        } disabled:opacity-60`}
      >
        {state === "recording" ? "Stopp" : state === "uploading" ? "…" : "Aufnehmen"}
      </button>
      <div className="text-sm text-[var(--muted)] h-5">
        {state === "recording" && <span className="tabular-nums">{mm}:{ss}</span>}
        {state === "uploading" && "Wird gespeichert und transkribiert…"}
        {state === "idle" && "Tippen, reden, tippen."}
      </div>
      {error && <p className="text-sm text-[var(--danger)] text-center">{error}</p>}
    </div>
  );
}
