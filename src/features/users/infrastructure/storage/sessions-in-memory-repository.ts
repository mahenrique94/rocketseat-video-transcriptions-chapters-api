import type { Session } from '@features/users/domain/session'
import type { ISessionsRepository } from './sessions-repository.ts'

export class SessionsInMemoryRepository implements ISessionsRepository {
  private sessions: Session[] = []

  async save(session: Session): Promise<Session> {
    const index = this.sessions.findIndex((stored) => stored.id === session.id)

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

  async revokeAllActiveByUserId(userId: string): Promise<void> {
    for (const session of this.sessions) {
      if (session.userId === userId && !session.isRevoked()) {
        this.sessions[this.sessions.indexOf(session)] = session.revoke()
      }
    }
  }

  async revokeByJtiHash(jtiHash: string): Promise<void> {
    const index = this.sessions.findIndex((session) => session.jtiHash === jtiHash)

    if (index >= 0) {
      this.sessions[index] = this.sessions[index].revoke()
    }
  }
}
