import { hash } from 'bcrypt'
import type { IUsersRepository } from '../infrastructure/storage/users-repository'
import type { UseCase } from '@shared/types/use-case'
import { User } from '@features/users/domain/user'
import { EntityAlreadyExists } from '@shared/exceptions/index'
import { CreateUserDTO } from './dto/create-user.dto'
import { ReturnUserDTO } from './dto/return-user.dto'

export class CreateUserUseCase implements UseCase<CreateUserDTO, ReturnUserDTO> {
  constructor(private readonly usersRepository: IUsersRepository) {}

  async execute(input: CreateUserDTO): Promise<ReturnUserDTO> {
    const existing = await this.usersRepository.findByEmail(input.email)
    if (existing) {
      throw new EntityAlreadyExists('Já existe um usuário com este e-mail')
    }

    const passwordHash = await hash(input.password, 10)

    const user = User.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: passwordHash,
    })

    const created = await this.usersRepository.createUser(user)

    return new ReturnUserDTO(
      created.id,
      created.firstName,
      created.lastName,
      created.email,
      created.createdAt,
      created.updatedAt,
      created.active,
      created.role,
    )
  }
}
