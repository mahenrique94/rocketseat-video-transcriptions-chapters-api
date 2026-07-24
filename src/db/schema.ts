import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'

export const transcriptions = pgTable('transcriptions', {
  id: varchar('id', { length: 21 }).primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  content: text('content').notNull(),
  youtubeUrl: text('youtube_url').notNull(),
  youtubeId: varchar('youtube_id', { length: 11 }).notNull(),
  videoUrl: text('video_url').notNull(),
  videoId: varchar('video_id').notNull(),
})
