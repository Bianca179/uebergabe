import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, USER_ID, schema } from "@/db";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
  const body = (await req.json().catch(() => ({}))) as { status?: "open" | "done"; priority?: number };
  const patch: Partial<typeof schema.tasks.$inferInsert> = {};
  if (body.status === "done") {
    patch.status = "done";
    patch.doneAt = new Date();
  } else if (body.status === "open") {
    patch.status = "open";
    patch.doneAt = null;
  }
  if (body.priority && body.priority >= 1 && body.priority <= 3) patch.priority = body.priority;
  const db = await getDb();
  const [task] = await db
    .update(schema.tasks)
    .set(patch)
    .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.userId, USER_ID)))
    .returning();
  if (!task) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(task);
}
