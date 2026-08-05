import type { DbClient } from '@shared/db/index'
import { eq } from 'drizzle-orm'
import { users } from './tables'
import { User } from '@features/users/domain/user'
import type { IUsersRepository } from './users-repository.ts'

export class UsersPostgresRepository implements IUsersRepository {
  constructor(private db: DbClient) {}

  async createUser(user: User) {
    const [result] = await this.db
      .insert(users)
      .values({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: user.password,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        active: user.active,
        role: user.role,
      })
      .returning()

    return User.toEntity(result)
  }

  async findByEmail(email: string) {
    const [result] = await this.db.select().from(users).where(eq(users.email, email))

    if (!result) {
      return null
    }

    return User.toEntity(result)
  }

  async findById(id: string) {
    const [result] = await this.db.select().from(users).where(eq(users.id, id))

    if (!result) {
      return null
    }

    return User.toEntity(result)
  }
}
