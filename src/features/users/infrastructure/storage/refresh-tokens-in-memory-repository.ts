import type { RefreshToken } from '@features/users/domain/refresh-token'
import type { IRefreshTokensRepository } from './refresh-tokens-repository.ts'

export class RefreshTokensInMemoryRepository implements IRefreshTokensRepository {
  private refreshTokens: RefreshToken[] = []

  async save(refreshToken: RefreshToken): Promise<RefreshToken> {
    const index = this.refreshTokens.findIndex((token) => token.id === refreshToken.id)

    if (index >= 0) {
      this.refreshTokens[index] = refreshToken
    } else {
      this.refreshTokens.push(refreshToken)
    }

    return refreshToken
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.refreshTokens.find((token) => token.tokenHash === tokenHash) ?? null
  }

  async revoke(refreshToken: RefreshToken): Promise<void> {
    const index = this.refreshTokens.findIndex((token) => token.id === refreshToken.id)

    if (index >= 0) {
      this.refreshTokens[index] = refreshToken.revoke()
    }
  }

  async revokeAllActiveByUserId(userId: string): Promise<void> {
    for (const token of this.refreshTokens) {
      if (token.userId === userId && !token.isRevoked()) {
        this.refreshTokens[this.refreshTokens.indexOf(token)] = token.revoke()
      }
    }
  }
}
