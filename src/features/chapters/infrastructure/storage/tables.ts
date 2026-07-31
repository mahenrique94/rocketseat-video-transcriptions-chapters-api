import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { videos } from '@features/videos/infrastructure/storage/tables'

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

export type Chapter = typeof videoChapters.$inferSelect
