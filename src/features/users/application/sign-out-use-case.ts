import type { IRefreshTokensRepository } from '../infrastructure/storage/refresh-tokens-repository'
import type { ISessionsRepository } from '../infrastructure/storage/sessions-repository'
import type { UseCase } from '@shared/types/use-case'
import { Session } from '../domain/session'
import { SignOutDTO } from './dto/sign-out.dto'

export class SignOutUseCase implements UseCase<SignOutDTO, void> {
  constructor(
    private readonly sessionsRepository: ISessionsRepository,
    private readonly refreshTokensRepository: IRefreshTokensRepository,
  ) {}

  async execute(input: SignOutDTO): Promise<void> {
    await this.sessionsRepository.deleteByJtiHash(Session.hashJti(input.jti))
    await this.refreshTokensRepository.revokeAllActiveByUserId(input.userId)
  }
}
