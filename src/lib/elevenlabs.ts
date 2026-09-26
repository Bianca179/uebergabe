import { readKey } from "@/lib/secrets";

const BASE = "https://api.elevenlabs.io/v1";

function key(): string {
  return readKey("ELEVENLABS_API_KEY");
}

export const DEFAULT_VOICE_ID = (process.env.ELEVENLABS_VOICE_ID ?? "").trim().split(/\s+/)[0] || "RqYtbPVBBytc1OIowrh0";

export async function transcribe(file: Blob, filename: string): Promise<string> {
  const form = new FormData();
  form.append("model_id", "scribe_v1");
  form.append("language_code", "deu");
  form.append("file", file, filename);
  const res = await fetch(`${BASE}/speech-to-text`, {
    method: "POST",
    headers: { "xi-api-key": key() },
    body: form,
  });
  if (!res.ok) throw new Error(`ElevenLabs STT ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { text?: string };
  return (json.text ?? "").trim();
}

export async function synthesize(text: string, voiceId: string): Promise<Uint8Array> {
  const res = await fetch(`${BASE}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key(), "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs TTS ${res.status}: ${await res.text()}`);
  return new Uint8Array(await res.arrayBuffer());
}

export type VoiceOption = { voiceId: string; name: string; category: string };

export async function listVoices(): Promise<VoiceOption[]> {
  const res = await fetch(`${BASE}/voices`, { headers: { "xi-api-key": key() } });
  if (!res.ok) throw new Error(`ElevenLabs voices ${res.status}`);
  const json = (await res.json()) as { voices: { voice_id: string; name: string; category?: string }[] };
  return json.voices
    .map((v) => ({ voiceId: v.voice_id, name: v.name, category: v.category ?? "" }))
    .sort((a, b) => {
      const ua = a.name.startsWith("Uebergabe") ? 0 : 1;
      const ub = b.name.startsWith("Uebergabe") ? 0 : 1;
      return ua - ub || a.name.localeCompare(b.name);
    });
}
