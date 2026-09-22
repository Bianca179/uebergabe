import path from "node:path";
import fs from "node:fs/promises";

const LOCAL_DIR = path.join(process.cwd(), ".data", "audio");

/** Stores an audio file and returns a URL the browser can play. */
export async function storeAudio(key: string, data: Uint8Array, contentType: string): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(key, Buffer.from(data), { access: "public", contentType, addRandomSuffix: true });
    return blob.url;
  }
  const safe = key.replace(/[^a-zA-Z0-9/_.-]/g, "_");
  const file = path.join(LOCAL_DIR, safe);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
  return `/api/audio/${safe}`;
}

export async function readLocalAudio(relative: string): Promise<{ data: Buffer; contentType: string } | null> {
  const file = path.normalize(path.join(LOCAL_DIR, relative));
  if (!file.startsWith(LOCAL_DIR)) return null;
  try {
    const data = await fs.readFile(file);
    const ext = path.extname(file).toLowerCase();
    const contentType =
      ext === ".mp3" ? "audio/mpeg" : ext === ".webm" ? "audio/webm" : ext === ".mp4" || ext === ".m4a" ? "audio/mp4" : "application/octet-stream";
    return { data, contentType };
  } catch {
    return null;
  }
}
