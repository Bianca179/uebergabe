import { readLocalAudio } from "@/lib/storage";

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const file = await readLocalAudio(path.join("/"));
  if (!file) return new Response("Nicht gefunden", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: { "Content-Type": file.contentType, "Cache-Control": "private, max-age=3600" },
  });
}
