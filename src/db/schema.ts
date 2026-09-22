import { integer, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("Marietta"),
  salutation: text("salutation").notNull().default("Marietta"),
  voiceId: text("voice_id"),
  tonality: text("tonality")
    .notNull()
    .default(
      "ruhig, tief, souverän, vertraut. Ein Mann, der sie gut kennt, alles im Griff hat und ihr das Gefühl gibt, dass sie einfach nur loslegen muss. Charmant mit einem Augenzwinkern, nie schmierig, nie albern. Er darf sie leicht necken.",
    ),
  notionToken: text("notion_token"),
  notionDatabaseId: text("notion_database_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const handovers = pgTable("handovers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("open"), // open | briefed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  briefedAt: timestamp("briefed_at", { withTimezone: true }),
});

export const recordings = pgTable("recordings", {
  id: serial("id").primaryKey(),
  handoverId: integer("handover_id").notNull(),
  audioPath: text("audio_path").notNull(),
  transcript: text("transcript"),
  durationS: real("duration_s"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  handoverId: integer("handover_id"),
  title: text("title").notNull(),
  context: text("context").notNull().default("privat"), // lilit | sucra | privat
  priority: integer("priority").notNull().default(2), // 1 = jetzt, 2 = bald, 3 = irgendwann
  dueDate: text("due_date"),
  person: text("person"),
  source: text("source").notNull().default("voice"), // voice | manual | notion
  notionPageId: text("notion_page_id"),
  status: text("status").notNull().default("open"), // open | done
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  doneAt: timestamp("done_at", { withTimezone: true }),
});

export const briefings = pgTable("briefings", {
  id: serial("id").primaryKey(),
  handoverId: integer("handover_id").notNull(),
  script: text("script").notNull(),
  audioPath: text("audio_path"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  playedAt: timestamp("played_at", { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type Handover = typeof handovers.$inferSelect;
export type Recording = typeof recordings.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Briefing = typeof briefings.$inferSelect;
