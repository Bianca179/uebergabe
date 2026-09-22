import { and, asc, desc, eq, gt } from "drizzle-orm";
import { getDb, USER_ID, schema } from "@/db";
import type { Briefing, Handover, Recording, Task, User } from "@/db/schema";

const { users, handovers, recordings, tasks, briefings } = schema;

export async function getUser(): Promise<User> {
  const db = await getDb();
  const [u] = await db.select().from(users).where(eq(users.id, USER_ID));
  return u;
}

export async function getOpenHandover(): Promise<Handover> {
  const db = await getDb();
  const [h] = await db
    .select()
    .from(handovers)
    .where(and(eq(handovers.userId, USER_ID), eq(handovers.status, "open")))
    .orderBy(desc(handovers.id))
    .limit(1);
  if (h) return h;
  const [created] = await db.insert(handovers).values({ userId: USER_ID }).returning();
  return created;
}

export async function getRecordings(handoverId: number): Promise<Recording[]> {
  const db = await getDb();
  return db.select().from(recordings).where(eq(recordings.handoverId, handoverId)).orderBy(asc(recordings.id));
}

export async function getOpenTasks(): Promise<Task[]> {
  const db = await getDb();
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, USER_ID), eq(tasks.status, "open")))
    .orderBy(asc(tasks.priority), asc(tasks.dueDate), asc(tasks.id));
}

export async function getLatestBriefing(): Promise<Briefing | null> {
  const db = await getDb();
  const [b] = await db.select().from(briefings).orderBy(desc(briefings.id)).limit(1);
  return b ?? null;
}

export async function getDoneSince(since: Date | null): Promise<Task[]> {
  const db = await getDb();
  if (!since) return [];
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, USER_ID), eq(tasks.status, "done"), gt(tasks.doneAt, since)))
    .orderBy(asc(tasks.doneAt));
}

export type AppState = {
  user: Pick<User, "name" | "salutation">;
  handover: { id: number; createdAt: string };
  recordings: { id: number; createdAt: string; durationS: number | null; transcript: string | null }[];
  openTasks: Task[];
  latestBriefing: (Briefing & { createdAt: Date }) | null;
};

export async function getAppState(): Promise<AppState> {
  const user = await getUser();
  const handover = await getOpenHandover();
  const [recs, openTasks, latestBriefing] = await Promise.all([getRecordings(handover.id), getOpenTasks(), getLatestBriefing()]);
  return {
    user: { name: user.name, salutation: user.salutation },
    handover: { id: handover.id, createdAt: handover.createdAt.toISOString() },
    recordings: recs.map((r) => ({ id: r.id, createdAt: r.createdAt.toISOString(), durationS: r.durationS, transcript: r.transcript })),
    openTasks,
    latestBriefing,
  };
}
