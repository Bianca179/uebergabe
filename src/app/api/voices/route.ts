import { NextResponse } from "next/server";
import { listVoices } from "@/lib/elevenlabs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await listVoices());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
