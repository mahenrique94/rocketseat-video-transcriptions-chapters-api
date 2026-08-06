import type { IUsersRepository } from '../infrastructure/storage/users-repository'
import type { UseCase } from '@shared/types/use-case'
import { User } from '@features/users/domain/user'
import { InvalidConfirmationToken } from '@shared/exceptions/index'
import { ConfirmAccountDTO } from './dto/confirm-account.dto'

export class ConfirmAccountUseCase implements UseCase<ConfirmAccountDTO, void> {
  constructor(private readonly usersRepository: IUsersRepository) {}

  async execute(input: ConfirmAccountDTO): Promise<void> {
    const user = await this.usersRepository.findByConfirmationTokenHash(
      User.hashToken(input.token),
    )

    if (!user || user.isConfirmationTokenExpired()) {
      throw new InvalidConfirmationToken('Token de confirmação inválido ou expirado')
    }

    await this.usersRepository.updateUser(user.activate())
  }
}
