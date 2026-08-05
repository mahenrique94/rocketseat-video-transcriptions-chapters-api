import type { DbClient } from '@shared/db/index'
import { and, eq, isNull } from 'drizzle-orm'
import { refreshTokens } from './refresh-tokens-table'
import { RefreshToken } from '@features/users/domain/refresh-token'
import type { IRefreshTokensRepository } from './refresh-tokens-repository.ts'

export class RefreshTokensPostgresRepository implements IRefreshTokensRepository {
  constructor(private db: DbClient) {}

  async save(refreshToken: RefreshToken) {
    const [result] = await this.db
      .insert(refreshTokens)
      .values({
        id: refreshToken.id,
        tokenHash: refreshToken.tokenHash,
        userId: refreshToken.userId,
        expiresAt: refreshToken.expiresAt,
        revokedAt: refreshToken.revokedAt,
        createdAt: refreshToken.createdAt,
      })
      .returning()

    return RefreshToken.toEntity(result)
  }

  async findByTokenHash(tokenHash: string) {
    const [result] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))

    if (!result) {
      return null
    }

    return RefreshToken.toEntity(result)
  }

  async revoke(refreshToken: RefreshToken) {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, refreshToken.id))
  }

  async revokeAllActiveByUserId(userId: string) {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)))
  }
}
