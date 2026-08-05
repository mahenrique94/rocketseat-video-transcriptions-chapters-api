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
      true,
      null,
      params.role ?? 'user',
    )
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
    )
  }
}
