import type { User } from '@features/users/domain/user'

export interface IUsersRepository {
  createUser(user: User): Promise<User>
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  findByConfirmationTokenHash(tokenHash: string): Promise<User | null>
  updateUser(user: User): Promise<User>
}
