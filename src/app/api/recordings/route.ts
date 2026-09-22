import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getOpenHandover } from "@/lib/state";
import { storeAudio } from "@/lib/storage";
import { transcribe } from "@/lib/elevenlabs";

export const maxDuration = 120;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("audio");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "Keine Aufnahme erhalten" }, { status: 400 });
  }
  const durationS = Number(form.get("duration") ?? 0) || null;
  const ext = file.type.includes("mp4") || file.type.includes("m4a") ? "mp4" : file.type.includes("ogg") ? "ogg" : "webm";
  const handover = await getOpenHandover();
  const key = `recordings/${handover.id}/${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const audioPath = await storeAudio(key, bytes, file.type || `audio/${ext}`);

  const db = await getDb();
  const [rec] = await db
    .insert(schema.recordings)
    .values({ handoverId: handover.id, audioPath, durationS })
    .returning();

  let transcript = "";
  let transcriptError: string | null = null;
  try {
    transcript = await transcribe(file, `aufnahme.${ext}`);
    await db.update(schema.recordings).set({ transcript }).where(eq(schema.recordings.id, rec.id));
  } catch (e) {
    transcriptError = e instanceof Error ? e.message : String(e);
  }
  return NextResponse.json({ id: rec.id, transcript, transcriptError });
}
