import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, USER_ID, schema } from "@/db";
import { getUser } from "@/lib/state";
import { DEFAULT_VOICE_ID } from "@/lib/elevenlabs";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getUser();
  return NextResponse.json({
    name: u.name,
    salutation: u.salutation,
    tonality: u.tonality,
    voiceId: u.voiceId || DEFAULT_VOICE_ID,
    notionConnected: Boolean(u.notionToken && u.notionDatabaseId),
  });
}

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    salutation?: string;
    tonality?: string;
    voiceId?: string;
    notionToken?: string;
    notionDatabaseId?: string;
  };
  const patch: Partial<typeof schema.users.$inferInsert> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.salutation === "string" && body.salutation.trim()) patch.salutation = body.salutation.trim();
  if (typeof body.tonality === "string" && body.tonality.trim()) patch.tonality = body.tonality.trim();
  if (typeof body.voiceId === "string" && body.voiceId.trim()) patch.voiceId = body.voiceId.trim();
  if (typeof body.notionToken === "string") patch.notionToken = body.notionToken.trim() || null;
  if (typeof body.notionDatabaseId === "string") patch.notionDatabaseId = body.notionDatabaseId.trim() || null;
  const db = await getDb();
  await db.update(schema.users).set(patch).where(eq(schema.users.id, USER_ID));
  return GET();
}
