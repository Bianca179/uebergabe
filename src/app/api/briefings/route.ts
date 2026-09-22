import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, USER_ID, schema } from "@/db";
import { getDoneSince, getLatestBriefing, getOpenHandover, getOpenTasks, getRecordings, getUser } from "@/lib/state";
import { generateBriefing } from "@/lib/briefing";
import { DEFAULT_VOICE_ID, synthesize } from "@/lib/elevenlabs";
import { storeAudio } from "@/lib/storage";

export const maxDuration = 300;

export async function POST() {
  const db = await getDb();
  const user = await getUser();
  const handover = await getOpenHandover();
  const [recs, openTasks, latest] = await Promise.all([getRecordings(handover.id), getOpenTasks(), getLatestBriefing()]);
  const doneSinceLast = await getDoneSince(latest?.createdAt ?? null);

  const transcripts = recs
    .filter((r) => r.transcript && r.transcript.trim().length > 0)
    .map((r) => ({ at: r.createdAt, text: r.transcript as string }));

  let out;
  try {
    out = await generateBriefing({ user, transcripts, openTasks, doneSinceLast, now: new Date() });
  } catch (e) {
    return NextResponse.json({ error: `Briefing fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}` }, { status: 502 });
  }

  if (out.new_tasks.length > 0) {
    await db.insert(schema.tasks).values(
      out.new_tasks.map((t) => ({
        userId: USER_ID,
        handoverId: handover.id,
        title: t.title,
        context: t.context,
        priority: t.priority,
        dueDate: t.due_date,
        person: t.person,
        source: "voice",
      })),
    );
  }
  for (const r of out.reprioritized) {
    await db.update(schema.tasks).set({ priority: r.priority }).where(eq(schema.tasks.id, r.id));
  }

  let audioPath: string | null = null;
  let audioError: string | null = null;
  try {
    const mp3 = await synthesize(out.script, user.voiceId || DEFAULT_VOICE_ID);
    audioPath = await storeAudio(`briefings/${handover.id}.mp3`, mp3, "audio/mpeg");
  } catch (e) {
    audioError = e instanceof Error ? e.message : String(e);
  }

  const [briefing] = await db
    .insert(schema.briefings)
    .values({ handoverId: handover.id, script: out.script, audioPath })
    .returning();
  await db.update(schema.handovers).set({ status: "briefed", briefedAt: new Date() }).where(eq(schema.handovers.id, handover.id));

  return NextResponse.json({ briefing, newTasks: out.new_tasks.length, audioError });
}
