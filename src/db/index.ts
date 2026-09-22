import { sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import * as schema from "./schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = PgDatabase<any, typeof schema>;

const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    name text NOT NULL DEFAULT 'Marietta',
    salutation text NOT NULL DEFAULT 'Marietta',
    voice_id text,
    tonality text NOT NULL DEFAULT '',
    notion_token text,
    notion_database_id text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS handovers (
    id serial PRIMARY KEY,
    user_id integer NOT NULL,
    status text NOT NULL DEFAULT 'open',
    created_at timestamptz NOT NULL DEFAULT now(),
    briefed_at timestamptz
  )`,
  `CREATE TABLE IF NOT EXISTS recordings (
    id serial PRIMARY KEY,
    handover_id integer NOT NULL,
    audio_path text NOT NULL,
    transcript text,
    duration_s real,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS tasks (
    id serial PRIMARY KEY,
    user_id integer NOT NULL,
    handover_id integer,
    title text NOT NULL,
    context text NOT NULL DEFAULT 'privat',
    priority integer NOT NULL DEFAULT 2,
    due_date text,
    person text,
    source text NOT NULL DEFAULT 'voice',
    notion_page_id text,
    status text NOT NULL DEFAULT 'open',
    created_at timestamptz NOT NULL DEFAULT now(),
    done_at timestamptz
  )`,
  `CREATE TABLE IF NOT EXISTS briefings (
    id serial PRIMARY KEY,
    handover_id integer NOT NULL,
    script text NOT NULL,
    audio_path text,
    created_at timestamptz NOT NULL DEFAULT now(),
    played_at timestamptz
  )`,
];

const DEFAULT_TONALITY =
  "ruhig, tief, souverän, vertraut. Ein Mann, der sie gut kennt, alles im Griff hat und ihr das Gefühl gibt, dass sie einfach nur loslegen muss. Charmant mit einem Augenzwinkern, nie schmierig, nie albern. Er darf sie leicht necken.";

const globalForDb = globalThis as unknown as { __uebergabeDb?: Promise<Db> };

async function createDb(): Promise<Db> {
  let db: Db;
  if (process.env.DATABASE_URL) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    db = drizzle(neon(process.env.DATABASE_URL), { schema }) as unknown as Db;
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const path = await import("node:path");
    const fs = await import("node:fs/promises");
    const dir = path.join(process.cwd(), ".data", "pg");
    await fs.mkdir(dir, { recursive: true });
    db = drizzle(new PGlite(dir), { schema }) as unknown as Db;
  }
  for (const stmt of SCHEMA_SQL) await db.execute(sql.raw(stmt));
  // Single-user MVP: make sure user 1 exists.
  await db.execute(
    sql`INSERT INTO users (id, tonality) VALUES (1, ${DEFAULT_TONALITY}) ON CONFLICT (id) DO NOTHING`,
  );
  return db;
}

export function getDb(): Promise<Db> {
  if (!globalForDb.__uebergabeDb) globalForDb.__uebergabeDb = createDb();
  return globalForDb.__uebergabeDb;
}

export const USER_ID = 1;
export { schema };
