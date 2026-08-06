import { pgTable, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import type { UserRole } from '@features/users/domain/user'

export const users = pgTable('users', {
  id: varchar('id', { length: 21 }).primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  active: boolean('active').notNull(),
  role: text('role').$type<UserRole>().notNull().default('user'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  confirmationTokenHash: text('confirmation_token_hash').unique(),
  confirmationTokenExpiresAt: timestamp('confirmation_token_expires_at', { withTimezone: true }),
})

export type User = typeof users.$inferSelect
