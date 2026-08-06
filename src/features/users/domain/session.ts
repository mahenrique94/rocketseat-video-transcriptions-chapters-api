import { createHash } from 'node:crypto'
import { nanoid } from 'nanoid'

export class Session {
  constructor(
    public readonly id: string,
    public readonly jtiHash: string,
    public readonly userId: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
  ) {}

  static create(params: {
    userId: string
    jti: string
    expiresAt: Date
  }) {
    const now = new Date()
    return new Session(
      nanoid(),
      Session.hashJti(params.jti),
      params.userId,
      params.expiresAt,
      now,
    )
  }

  static hashJti(jti: string): string {
    return createHash('sha256').update(jti).digest('hex')
  }

  static toEntity(data: {
    id: string
    jtiHash: string
    userId: string
    expiresAt: Date
    createdAt: Date
  }) {
    return new Session(
      data.id,
      data.jtiHash,
      data.userId,
      data.expiresAt,
      data.createdAt,
    )
  }

  isExpired(now = new Date()): boolean {
    return this.expiresAt <= now
  }
}
