import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './tables'

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 21 }).primaryKey(),
  jtiHash: text('jti_hash').notNull().unique(),
  userId: varchar('user_id', { length: 21 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
})

export type SessionRow = typeof sessions.$inferSelect
