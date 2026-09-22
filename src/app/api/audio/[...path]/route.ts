import { readAudio } from "@/lib/storage";

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const file = await readAudio(path.join("/"));
  if (!file) return new Response("Nicht gefunden", { status: 404 });
  return new Response(Buffer.from(file.data), {
    headers: { "Content-Type": file.contentType, "Cache-Control": "private, max-age=3600" },
  });
}
