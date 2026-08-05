import type { DbClient } from '@shared/db/index'
import { and, eq, isNull } from 'drizzle-orm'
import { sessions } from './sessions-table'
import { Session } from '@features/users/domain/session'
import type { ISessionsRepository } from './sessions-repository.ts'

export class SessionsPostgresRepository implements ISessionsRepository {
  constructor(private db: DbClient) {}

  async save(session: Session) {
    const [result] = await this.db
      .insert(sessions)
      .values({
        id: session.id,
        jtiHash: session.jtiHash,
        userId: session.userId,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt,
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

  async revokeAllActiveByUserId(userId: string) {
    await this.db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)))
  }

  async revokeByJtiHash(jtiHash: string) {
    await this.db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.jtiHash, jtiHash), isNull(sessions.revokedAt)))
  }
}
