import type { DbClient } from '@shared/db/index'
import { eq } from 'drizzle-orm'
import { sessions } from './sessions-table'
import { Session } from '@features/users/domain/session'
import type { ISessionsRepository } from './sessions-repository.ts'

export class SessionsPostgresRepository implements ISessionsRepository {
  constructor(private db: DbClient) {}

  async upsertByUserId(session: Session) {
    const [existing] = await this.db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.userId, session.userId))

    if (existing) {
      const [result] = await this.db
        .update(sessions)
        .set({
          jtiHash: session.jtiHash,
          expiresAt: session.expiresAt,
        })
        .where(eq(sessions.id, existing.id))
        .returning()

      return Session.toEntity(result)
    }

    const [result] = await this.db
      .insert(sessions)
      .values({
        id: session.id,
        jtiHash: session.jtiHash,
        userId: session.userId,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
      })
      .returning()

    return Session.toEntity(result)
  }

  async findByJtiHash(jtiHash: string) {
    const [result] = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.jtiHash, jtiHash))

    if (!result) {
      return null
    }

    return Session.toEntity(result)
  }

  async deleteByJtiHash(jtiHash: string) {
    await this.db
      .delete(sessions)
      .where(eq(sessions.jtiHash, jtiHash))
  }
}
