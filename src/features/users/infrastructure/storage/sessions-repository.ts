import type { Session } from '@features/users/domain/session'

export interface ISessionsRepository {
  save(session: Session): Promise<Session>
  findByJtiHash(jtiHash: string): Promise<Session | null>
  revokeAllActiveByUserId(userId: string): Promise<void>
  revokeByJtiHash(jtiHash: string): Promise<void>
}
