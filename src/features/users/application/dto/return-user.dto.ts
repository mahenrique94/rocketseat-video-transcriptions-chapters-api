import type { UserRole } from '@features/users/domain/user'

export class ReturnUserDTO {
  constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly active: boolean,
    public readonly role: UserRole,
    public readonly confirmationToken: string,
  ) {}
}
