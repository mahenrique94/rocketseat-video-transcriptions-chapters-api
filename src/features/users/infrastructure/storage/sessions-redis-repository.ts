import { Session } from '@features/users/domain/session'
import type { RedisClient } from '@shared/redis/index'
import type { ISessionsRepository } from './sessions-repository'

const sessionKey = (jtiHash: string) => `session:${jtiHash}`
const userSessionKey = (userId: string) => `session:user:${userId}`

export class SessionsRedisRepository implements ISessionsRepository {
  constructor(private readonly redis: RedisClient) {}

  async upsertByUserId(session: Session): Promise<Session> {
    const previousJtiHash = await this.redis.get(userSessionKey(session.userId))
    const ttlSeconds = Math.max(
      1,
      Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
    )

    await this.redis
      .multi()
      .set(
        sessionKey(session.jtiHash),
        JSON.stringify(this.serialize(session)),
        'EX',
        ttlSeconds,
      )
      .set(userSessionKey(session.userId), session.jtiHash)
      .exec()

    if (previousJtiHash && previousJtiHash !== session.jtiHash) {
      await this.redis.del(sessionKey(previousJtiHash))
    }

    return session
  }

  async findByJtiHash(jtiHash: string): Promise<Session | null> {
    const raw = await this.redis.get(sessionKey(jtiHash))

    if (!raw) {
      return null
    }

    return Session.toEntity(this.deserialize(raw))
  }

  async deleteByJtiHash(jtiHash: string): Promise<void> {
    const raw = await this.redis.get(sessionKey(jtiHash))

    if (!raw) {
      return
    }

    const session = Session.toEntity(this.deserialize(raw))

    const multi = this.redis.multi()
    multi.del(sessionKey(jtiHash))

    const currentJtiHash = await this.redis.get(userSessionKey(session.userId))
    if (currentJtiHash === jtiHash) {
      multi.del(userSessionKey(session.userId))
    }

    await multi.exec()
  }

  private serialize(session: Session) {
    return {
      id: session.id,
      jtiHash: session.jtiHash,
      userId: session.userId,
      expiresAt: session.expiresAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
    }
  }

  private deserialize(raw: string) {
    const data = JSON.parse(raw) as {
      id: string
      jtiHash: string
      userId: string
      expiresAt: string
      createdAt: string
    }

    return {
      id: data.id,
      jtiHash: data.jtiHash,
      userId: data.userId,
      expiresAt: new Date(data.expiresAt),
      createdAt: new Date(data.createdAt),
    }
  }
}
