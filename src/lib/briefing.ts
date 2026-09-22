import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Task, User } from "@/db/schema";

const NewTask = z.object({
  title: z.string().describe("Kurzer, konkreter Aufgabentitel, max. 80 Zeichen"),
  context: z.enum(["lilit", "sucra", "privat"]).describe("lilit = Training/Coaching, sucra = Stiefel-Laden, privat = alles andere"),
  priority: z.number().int().min(1).max(3).describe("1 = jetzt, 2 = bald, 3 = irgendwann"),
  due_date: z.string().nullable().describe("ISO-Datum YYYY-MM-DD, wenn eine Frist genannt wurde, sonst null"),
  person: z.string().nullable().describe("Beteiligte Person, falls genannt, sonst null"),
});

const Output = z.object({
  new_tasks: z.array(NewTask).describe("Aufgaben aus den neuen Aufnahmen, die noch nicht in der offenen Liste stehen"),
  reprioritized: z
    .array(z.object({ id: z.number().int(), priority: z.number().int().min(1).max(3) }))
    .describe("Bestehende offene Aufgaben, deren Priorität sich durch die neuen Informationen ändert"),
  script: z.string().describe("Der gesprochene Briefing-Text"),
});

export type BriefingOutput = z.infer<typeof Output>;

export type BriefingInput = {
  user: User;
  transcripts: { at: Date; text: string }[];
  openTasks: Task[];
  doneSinceLast: Task[];
  now: Date;
};

function systemPrompt(user: User): string {
  return `Du schreibst das gesprochene Briefing einer App namens Übergabe. Die Nutzerin ${user.name} ist Kommunikationstrainerin (Lilit Kommunikation) und betreibt mit ihrem Mann Hasan einen Laden für handgemachte Cowboystiefel (Ms Sucra) in Mainz. Bevor sie das Büro verlassen hat, hat sie ihre offenen Punkte eingesprochen. Jetzt ist sie zurück am Schreibtisch und hört dein Briefing.

Du sprichst als ihr persönlicher Assistent mit männlicher Stimme. Tonalität: ${user.tonality} Sprich sie mit "${user.salutation}" an.

Du bekommst: die neuen Aufnahmen (Transkripte), die bereits offene Aufgabenliste, und was sie seit dem letzten Briefing erledigt hat.

Deine Aufgaben:
1. Ziehe aus den Transkripten die konkreten Aufgaben. Keine Dubletten zu bereits offenen Aufgaben anlegen; wenn eine Aufnahme eine offene Aufgabe nur erwähnt, ist sie keine neue Aufgabe. Wenn eine Aufnahme sagt, dass etwas erledigt ist, lege es nicht an.
2. Priorisiere die Gesamtliste (neu und offen) nach Dringlichkeit und Wichtigkeit. Fristen und überfällige Dinge zuerst. Nutze reprioritized nur, wenn sich eine Priorität wirklich ändert.
3. Schreibe das Briefing. Du liest nicht vor, du briefst: Wichtigstes zuerst, Kleinkram zusammengefasst, Namen und Fristen nennen. Erwähne kurz, was sie erledigt hat, wenn es etwas gab. Schlage genau einen ersten Schritt vor. Wenn es keine neuen Aufnahmen gab, sag das ehrlich und brief den Stand der offenen Liste.

Regeln für den Text: 100 bis 180 Wörter. Nur der gesprochene Text, keine Überschriften, keine Listen, keine Regieanweisungen, keine Emojis, keine Markdown-Zeichen. Deutsch, natürliche gesprochene Sprache, kurze Sätze. Zahlen und Uhrzeiten so schreiben, wie man sie spricht.`;
}

function fmtDate(d: Date): string {
  return d.toLocaleString("de-DE", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
}

function userMessage(input: BriefingInput): string {
  const parts: string[] = [];
  parts.push(`Jetzt ist ${fmtDate(input.now)}.`);
  if (input.transcripts.length === 0) {
    parts.push("\nNeue Aufnahmen: keine.");
  } else {
    parts.push("\nNeue Aufnahmen:");
    for (const t of input.transcripts) parts.push(`[${fmtDate(t.at)}]\n${t.text}`);
  }
  if (input.openTasks.length === 0) {
    parts.push("\nOffene Aufgaben: keine.");
  } else {
    parts.push("\nOffene Aufgaben (id | Priorität | Bereich | Frist | Titel | angelegt):");
    for (const t of input.openTasks) {
      parts.push(`${t.id} | ${t.priority} | ${t.context} | ${t.dueDate ?? "-"} | ${t.title}${t.person ? ` (${t.person})` : ""} | ${t.createdAt.toISOString().slice(0, 10)}`);
    }
  }
  if (input.doneSinceLast.length > 0) {
    parts.push("\nSeit dem letzten Briefing erledigt:");
    for (const t of input.doneSinceLast) parts.push(`- ${t.title}`);
  }
  return parts.join("\n");
}

export async function generateBriefing(input: BriefingInput): Promise<BriefingOutput> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 8000,
    system: systemPrompt(input.user),
    messages: [{ role: "user", content: userMessage(input) }],
    output_config: { format: zodOutputFormat(Output) },
  });
  if (response.stop_reason === "refusal") throw new Error("Das Modell hat die Anfrage abgelehnt.");
  if (!response.parsed_output) throw new Error("Antwort konnte nicht gelesen werden.");
  return response.parsed_output;
}
