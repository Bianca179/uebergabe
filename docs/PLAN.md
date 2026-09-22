# Übergabe – Plan (Stand 2026-09-22)

Sprach-Übergabe an das zukünftige Ich: Marietta spricht vor dem Training ihre offenen
Punkte ein und bekommt bei der Rückkehr ein priorisiertes Audio-Briefing in einer
männlichen Stimme mit Charakter. Tasks landen in ihrer Notion-To-do-Liste.

## Nutzerin

- Marietta Gädeke, Lilit Kommunikation (Training, Coaching, Keynotes) und Ms Sucra
  (Cowboystiefel-Laden in Mainz, zusammen mit Hasan Eisso).
- Zwei Geschäfte, also zwei Task-Kontexte: `lilit`, `sucra`, dazu `privat`.
- Nutzt Handy und Rechner. Sprache: Deutsch.
- Stimme: "wie ihr Mann". Zwei Wege: ElevenLabs-Voice-Clone (mit seinem Einverständnis,
  ca. 2 Minuten sauberes Audio) oder eine ähnliche Stimme aus der Voice Library.

## Kreislauf

1. **Aufnehmen.** Großer Knopf, frei reden, Stopp. Mehrere Aufnahmen pro Abwesenheit
   sammeln sich zu einer Übergabe. Jede Aufnahme wird sofort nach dem Upload
   transkribiert (kurze Serverlaufzeit pro Schritt).
2. **Zurück.** Sie tippt "Ich bin zurück". Server holt offene Notion-Tasks, alle
   Transkripte der Übergabe und die erledigten Tasks seit dem letzten Briefing.
3. **Denken.** Claude extrahiert Tasks (Titel, Kontext, Frist, Priorität, Person),
   gleicht sie mit Notion ab, priorisiert die Gesamtliste und schreibt das
   Briefing-Skript in der eingestellten Tonalität. Ausgabe als JSON: Tasks + Skript.
4. **Sprechen.** ElevenLabs erzeugt das Audio. Gespeichert in Supabase Storage.
5. **Empfangen.** Player oben, priorisierte Taskliste mit Checkboxen darunter.
   Neue Tasks werden in Notion angelegt, bestehende nicht angefasst (nur gelesen).

Der Kalender-Trigger (Briefing automatisch nach Terminende) ist Ausbaustufe.

## Stack

| Baustein | Wahl | Warum |
|---|---|---|
| App | Next.js (App Router), TypeScript, Tailwind, PWA | Ein Code für Handy und Rechner, Mikrofon und Audio laufen im Browser, auf den Homebildschirm legbar |
| Hosting | Vercel | Native Next.js-Unterstützung, Functions mit langer Laufzeit, GitHub-Deploy |
| DB, Auth, Storage | Supabase, Region Frankfurt | Postgres, Magic-Link-Login, Audio-Storage, EU |
| STT | ElevenLabs Scribe | Sehr gutes Deutsch, gleicher Account wie TTS |
| LLM | Claude (Anthropic) | Extraktion, Priorisierung, Skript |
| TTS | ElevenLabs | Stimmen mit Charakter, Voice Clone möglich |
| Tasks | Notion API | Bestehende To-do-Liste bleibt die Wahrheit |

Warum nicht Render oder Netlify: Netlify geht genauso, Render nur bei Bedarf an einem
Dauerserver. Der Render-Free-Tier schläft ein und braucht 30 bis 60 Sekunden zum
Aufwachen, genau im "Ich bin zurück"-Moment. "Homepage auf den Homebildschirm" ist
keine Alternative zum Hosting, sondern die PWA, die auf jedem dieser Hoster läuft.

Hinweis: Vercel Hobby ist nur für nicht-kommerzielle Nutzung. Ab Monetarisierung
Vercel Pro (ca. 20 USD/Monat).

## Datenmodell

- `users`: id, name, anrede, voice_id, tonality (Freitext), notion_database_id
- `handovers`: id, user_id, status (`open` | `briefed`), created_at, briefed_at
- `recordings`: id, handover_id, audio_path, transcript, duration_s, created_at
- `tasks`: id, user_id, title, context (`lilit` | `sucra` | `privat`), priority (1–3),
  due_date, source (`voice` | `notion`), notion_page_id, status, created_at
- `briefings`: id, handover_id, script, audio_path, created_at, played_at

`user_id` ab Tag eins in jeder Tabelle, damit Multi-User später keine Migration ist.

## Screens (MVP)

1. **Start**: Aufnahmeknopf, Zähler "3 Aufnahmen gesammelt", Knopf "Ich bin zurück".
2. **Briefing**: Player, Wartezustand während der Erzeugung ("Er sortiert gerade…"),
   darunter die priorisierte Liste mit Checkboxen und Kontext-Tag.
3. **Einstellungen**: Name und Anrede, Stimme, Tonalität, Notion-Datenbank.

## Phasen

- **Phase 0, Stimm-Demo**: 30-Sekunden-Briefing mit zwei bis drei Stimmen, ohne App.
  Prüft, ob der Kern trägt, bevor gebaut wird.
- **Phase 1, MVP**: Aufnahme, Transkription, Briefing mit Priorisierung, Notion
  lesen und schreiben, PWA, Login für eine Nutzerin.
- **Phase 2**: Kalender-Trigger, Push "Willkommen zurück", mehrere Personas,
  Tasks tippen, Briefing vorab erzeugen statt bei Rückkehr.
- **Phase 3, Monetarisierung**: Multi-User, Stripe-Abo, Onboarding mit
  Partner-Stimme und Einverständnis-Flow, Landingpage.

## Risiken (Roast)

1. **"Wie ihr Mann" ist eine Person, kein Stil.** Die Stimme liefert Klangfarbe,
   das Skript liefert Tonalität. Das Sprachmodell schreibt, braucht aber eine
   Richtung: drei Adjektive, wie er mit ihr spricht, und wie er sie nennt.
2. **Voice Clone skaliert nicht ohne Consent-Flow.** Für Marietta ok, für ein
   Produkt braucht es Einverständnis der geklonten Person als Pflichtschritt.
3. **Priorisieren ohne Notion-Kontext ist Raten.** Deshalb liest das Briefing die
   offenen Notion-Tasks mit. Schreiben nur neue Tasks, nie bestehende ändern.
4. **Ohne Aufnahme kein Briefing.** Die Aufnahme muss ein 10-Sekunden-Ritual sein:
   App öffnen, Knopf, reden. Kein Login-Dialog dazwischen.
5. **Serverlaufzeit.** STT pro Aufnahme sofort, Briefing bei Rückkehr in 15 bis 30 s.
   Eine einzelne Function darf nicht die ganze Kette machen.
6. **Eine Nutzerin ist kein Markt.** Erst drei Wochen echte Nutzung messen, dann
   monetarisieren.
7. **iOS-PWA-Eigenheiten.** Mikrofon und Push funktionieren ab iOS 16.4, Audio
   startet nur nach Tipp. Beides ist im Design berücksichtigt.

## Laufende Kosten (Schätzung)

- ElevenLabs Starter 5 USD/Monat (Instant Voice Clone), Creator 22 USD für
  Professional Clone.
- Anthropic und ElevenLabs-Nutzung: wenige Cent pro Briefing.
- Supabase Free, Vercel Hobby (nicht-kommerziell) oder Pro.

## Benötigt zum Start

- Anthropic API-Key
- ElevenLabs API-Key (Starter oder höher, falls Clone)
- Supabase-Projekt in Frankfurt: URL, anon key, service role key
- Vercel-Account, mit diesem GitHub-Repo verbunden
- Notion-Integration: Token, To-do-Datenbank für die Integration freigegeben, Link zur
  Datenbank
- Drei Adjektive zur Tonalität, Anrede, Entscheidung Clone oder Library-Stimme
