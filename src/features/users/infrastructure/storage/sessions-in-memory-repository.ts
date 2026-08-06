import type { Session } from '@features/users/domain/session'
import type { ISessionsRepository } from './sessions-repository.ts'

export class SessionsInMemoryRepository implements ISessionsRepository {
  private sessions: Session[] = []

  async upsertByUserId(session: Session): Promise<Session> {
    const index = this.sessions.findIndex((stored) => stored.userId === session.userId)

    if (index >= 0) {
      this.sessions[index] = session
    } else {
      this.sessions.push(session)
    }

    return session
  }

  async findByJtiHash(jtiHash: string): Promise<Session | null> {
    return this.sessions.find((session) => session.jtiHash === jtiHash) ?? null
  }

  async deleteByJtiHash(jtiHash: string): Promise<void> {
    const index = this.sessions.findIndex((session) => session.jtiHash === jtiHash)

    if (index >= 0) {
      this.sessions.splice(index, 1)
    }
  }
}
