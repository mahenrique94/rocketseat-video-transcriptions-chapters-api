import type { User } from '@features/users/domain/user'
import type { IUsersRepository } from './users-repository.ts'

export class UsersInMemoryRepository implements IUsersRepository {
  private users: User[] = []

  async createUser(user: User): Promise<User> {
    this.users.push(user)
    return user
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null
  }
}
