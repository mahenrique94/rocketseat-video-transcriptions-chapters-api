import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './tables'

export const refreshTokens = pgTable('refresh_tokens', {
  id: varchar('id', { length: 21 }).primaryKey(),
  tokenHash: text('token_hash').notNull().unique(),
  userId: varchar('user_id', { length: 21 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
})

export type RefreshTokenRow = typeof refreshTokens.$inferSelect
