import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'

export const videos = pgTable('videos', {
  id: varchar('id', { length: 21 }).primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  videoUrl: text('video_url').notNull(),
  videoId: varchar('video_id').notNull(),
})

export type Video = typeof videos.$inferSelect
