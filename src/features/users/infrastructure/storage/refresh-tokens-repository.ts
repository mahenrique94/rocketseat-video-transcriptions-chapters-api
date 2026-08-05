import type { RefreshToken } from '@features/users/domain/refresh-token'

export interface IRefreshTokensRepository {
  save(refreshToken: RefreshToken): Promise<RefreshToken>
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>
  revoke(refreshToken: RefreshToken): Promise<void>
  revokeAllActiveByUserId(userId: string): Promise<void>
}
