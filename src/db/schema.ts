import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'

export const videos = pgTable('videos', {
  id: varchar('id', { length: 21 }).primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  videoUrl: text('video_url').notNull(),
  videoId: varchar('video_id').notNull(),
})

export const videoTranscriptions = pgTable('video_transcriptions', {
  id: varchar('id', { length: 21 }).primaryKey(),
  videoId: varchar('video_id')
    .notNull()
    .references(() => videos.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const videoChapters = pgTable('video_chapters', {
  id: varchar('id', { length: 21 }).primaryKey(),
  videoId: varchar('video_id')
    .notNull()
    .references(() => videos.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})
