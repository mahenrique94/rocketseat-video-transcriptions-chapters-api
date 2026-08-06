import { createHash } from 'node:crypto'
import { nanoid } from 'nanoid'

export type UserRole = 'user' | 'admin'

export class User {
  constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly password: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly active: boolean,
    public readonly deletedAt: Date | null,
    public readonly role: UserRole,
    public readonly confirmationTokenHash: string | null,
    public readonly confirmationTokenExpiresAt: Date | null,
  ) {}

  static create(params: {
    firstName: string
    lastName: string
    email: string
    password: string
    role?: UserRole
  }) {
    const now = new Date()
    return new User(
      nanoid(),
      params.firstName,
      params.lastName,
      params.email,
      params.password,
      now,
      now,
      false,
      null,
      params.role ?? 'user',
      null,
      null,
    )
  }

  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  static toEntity(data: {
    id: string
    firstName: string
    lastName: string
    email: string
    password: string
    createdAt: Date
    updatedAt: Date
    active: boolean
    deletedAt: Date | null
    role: UserRole
    confirmationTokenHash: string | null
    confirmationTokenExpiresAt: Date | null
  }) {
    return new User(
      data.id,
      data.firstName,
      data.lastName,
      data.email,
      data.password,
      data.createdAt,
      data.updatedAt,
      data.active,
      data.deletedAt,
      data.role,
      data.confirmationTokenHash,
      data.confirmationTokenExpiresAt,
    )
  }

  setConfirmationToken(tokenHash: string, expiresAt: Date): User {
    return new User(
      this.id,
      this.firstName,
      this.lastName,
      this.email,
      this.password,
      this.createdAt,
      new Date(),
      this.active,
      this.deletedAt,
      this.role,
      tokenHash,
      expiresAt,
    )
  }

  activate(): User {
    return new User(
      this.id,
      this.firstName,
      this.lastName,
      this.email,
      this.password,
      this.createdAt,
      new Date(),
      true,
      this.deletedAt,
      this.role,
      null,
      null,
    )
  }

  isConfirmationTokenExpired(now = new Date()): boolean {
    return (
      this.confirmationTokenExpiresAt !== null &&
      this.confirmationTokenExpiresAt <= now
    )
  }
}
