import path from "node:path";
import fs from "node:fs/promises";
import { eq } from "drizzle-orm";

const LOCAL_DIR = path.join(process.cwd(), ".data", "audio");

// Audio in der Datenbank ablegen, wenn eine echte Datenbank da ist (oder zum Testen erzwungen).
function dbAudioEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL) || process.env.AUDIO_STORE === "db";
}

function safeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9/_.-]/g, "_");
}

/**
 * Stores an audio file and returns a URL the browser can play.
 * Order: Vercel Blob (if token) → Postgres bytea (if DATABASE_URL) → local file.
 */
export async function storeAudio(key: string, data: Uint8Array, contentType: string): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(key, Buffer.from(data), { access: "public", contentType, addRandomSuffix: true });
    return blob.url;
  }
  const safe = safeKey(key);
  if (dbAudioEnabled()) {
    const { getDb, schema } = await import("@/db");
    const db = await getDb();
    await db
      .insert(schema.audioFiles)
      .values({ key: safe, contentType, data })
      .onConflictDoUpdate({ target: schema.audioFiles.key, set: { contentType, data } });
    return `/api/audio/${safe}`;
  }
  const file = path.join(LOCAL_DIR, safe);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
  return `/api/audio/${safe}`;
}

/** Reads audio served under /api/audio/<key>, from Postgres or the local directory. */
export async function readAudio(relative: string): Promise<{ data: Uint8Array; contentType: string } | null> {
  const safe = safeKey(relative);
  if (dbAudioEnabled()) {
    const { getDb, schema } = await import("@/db");
    const db = await getDb();
    const [row] = await db.select().from(schema.audioFiles).where(eq(schema.audioFiles.key, safe)).limit(1);
    if (!row) return null;
    return { data: new Uint8Array(row.data), contentType: row.contentType };
  }
  const file = path.normalize(path.join(LOCAL_DIR, relative));
  if (!file.startsWith(LOCAL_DIR)) return null;
  try {
    const data = await fs.readFile(file);
    const ext = path.extname(file).toLowerCase();
    const contentType =
      ext === ".mp3" ? "audio/mpeg" : ext === ".webm" ? "audio/webm" : ext === ".mp4" || ext === ".m4a" ? "audio/mp4" : "application/octet-stream";
    return { data: new Uint8Array(data), contentType };
  } catch {
    return null;
  }
}

/** Loads a stored recording by the URL that storeAudio returned. */
export async function loadAudio(audioPath: string): Promise<{ data: Uint8Array; contentType: string } | null> {
  if (audioPath.startsWith("/api/audio/")) return readAudio(audioPath.slice("/api/audio/".length));
  if (/^https?:\/\//.test(audioPath)) {
    const res = await fetch(audioPath);
    if (!res.ok) return null;
    return { data: new Uint8Array(await res.arrayBuffer()), contentType: res.headers.get("content-type") ?? "application/octet-stream" };
  }
  return null;
}
