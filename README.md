# Übergabe

Sprich deine offenen Punkte ein, bevor du gehst. Wenn du zurück bist, bekommst du ein
priorisiertes Audio-Briefing in einer Stimme mit Charakter, plus die Aufgabenliste zum Abhaken.

Plan, Entscheidungen und Roadmap: [docs/PLAN.md](docs/PLAN.md). Demo-Audios: [docs/demo/](docs/demo/).

## Wie es funktioniert

1. **Aufnehmen**: Knopf tippen, reden, Stopp. Jede Aufnahme wird sofort transkribiert (ElevenLabs Scribe).
2. **Ich bin zurück**: Claude liest alle Aufnahmen und die offene Liste, legt neue Aufgaben an,
   priorisiert und schreibt das Briefing. ElevenLabs spricht es ein. Dauer etwa 20 bis 30 Sekunden.
3. **Briefing**: Abspielen, Text optional einblenden, Aufgaben abhaken.

## Lokal starten

```bash
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY und ELEVENLABS_API_KEY eintragen
npm run dev                  # http://localhost:3000
```

Ohne `DATABASE_URL` läuft eine lokale Postgres-Datei (PGlite) unter `.data/pg`, ohne
`BLOB_READ_WRITE_TOKEN` landen Audios unter `.data/audio`. Ohne `APP_ACCESS_CODE` gibt es kein Login.

## Auf Vercel betreiben

1. Auf vercel.com einloggen, **Add New → Project**, dieses GitHub-Repo importieren. Framework wird
   als Next.js erkannt, nichts ändern, **Deploy**.
2. Im Projekt unter **Storage → Create Database → Neon (Postgres)**, Region **Frankfurt** wählen,
   mit dem Projekt verbinden. Vercel setzt `DATABASE_URL` automatisch.
3. Unter **Storage → Create → Blob** einen Store anlegen und verbinden. Vercel setzt
   `BLOB_READ_WRITE_TOKEN` automatisch.
4. Unter **Settings → Environment Variables** eintragen: `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`,
   `APP_ACCESS_CODE` (frei wählen). Optional `ELEVENLABS_VOICE_ID`.
5. **Deployments → Redeploy**, damit die Variablen greifen.
6. Die Vercel-URL auf dem Handy öffnen, Code eingeben, über "Teilen → Zum Home-Bildschirm" als App ablegen.

## Stack

Next.js (App Router, TypeScript, Tailwind) · Drizzle ORM · Neon Postgres oder PGlite ·
Vercel Blob oder lokale Dateien · ElevenLabs (Scribe STT, Multilingual v2 TTS) · Claude (`claude-opus-5`).

## Struktur

```
src/app/            Seiten: / (Aufnahme), /briefing, /settings, /login
src/app/api/        recordings, briefings, state, tasks/[id], settings, voices, login, audio/[...path]
src/lib/briefing.ts Prompt und strukturierte Ausgabe (Aufgaben + Skript)
src/lib/elevenlabs.ts  Transkription, Sprachausgabe, Stimmenliste
src/lib/storage.ts  Vercel Blob oder lokales Dateisystem
src/db/             Schema und Verbindung (Neon oder PGlite)
src/proxy.ts        Zugangscode-Sperre
```
