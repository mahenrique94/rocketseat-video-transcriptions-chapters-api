import { createHash } from 'node:crypto'
import { nanoid } from 'nanoid'

export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly tokenHash: string,
    public readonly userId: string,
    public readonly expiresAt: Date,
    public readonly revokedAt: Date | null,
    public readonly createdAt: Date,
  ) {}

  static create(params: {
    userId: string
    token: string
    expiresAt: Date
  }) {
    const now = new Date()
    return new RefreshToken(
      nanoid(),
      RefreshToken.hashToken(params.token),
      params.userId,
      params.expiresAt,
      null,
      now,
    )
  }

  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  static toEntity(data: {
    id: string
    tokenHash: string
    userId: string
    expiresAt: Date
    revokedAt: Date | null
    createdAt: Date
  }) {
    return new RefreshToken(
      data.id,
      data.tokenHash,
      data.userId,
      data.expiresAt,
      data.revokedAt,
      data.createdAt,
    )
  }

  isExpired(now = new Date()): boolean {
    return this.expiresAt <= now
  }

  isRevoked(): boolean {
    return this.revokedAt !== null
  }

  revoke(revokedAt = new Date()): RefreshToken {
    return new RefreshToken(
      this.id,
      this.tokenHash,
      this.userId,
      this.expiresAt,
      revokedAt,
      this.createdAt,
    )
  }
}
