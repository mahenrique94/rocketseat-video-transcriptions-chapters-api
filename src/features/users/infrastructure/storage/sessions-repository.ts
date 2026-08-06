import type { Session } from '@features/users/domain/session'

export interface ISessionsRepository {
  upsertByUserId(session: Session): Promise<Session>
  findByJtiHash(jtiHash: string): Promise<Session | null>
  deleteByJtiHash(jtiHash: string): Promise<void>
}
