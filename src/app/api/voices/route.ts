import { NextResponse } from "next/server";
import { listVoices } from "@/lib/elevenlabs";
import { errorMessage } from "@/lib/secrets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await listVoices());
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 502 });
  }
}
