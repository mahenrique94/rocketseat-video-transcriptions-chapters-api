import { nanoid } from 'nanoid'
import type { IUsersRepository } from '../infrastructure/storage/users-repository'
import type { IRefreshTokensRepository } from '../infrastructure/storage/refresh-tokens-repository'
import type { ISessionsRepository } from '../infrastructure/storage/sessions-repository'
import type { UseCase } from '@shared/types/use-case'
import type { IJwtProvider } from '@shared/auth/jwt-provider'
import type { IRefreshTokenGenerator } from '@shared/auth/refresh-token-generator'
import { InvalidRefreshToken } from '@shared/exceptions/index'
import { RefreshToken } from '../domain/refresh-token'
import { Session } from '../domain/session'
import { RefreshTokenDTO } from './dto/refresh-token.dto'
import { RefreshTokenResponseDTO } from './dto/refresh-token-response.dto'

export class RefreshTokenUseCase implements UseCase<RefreshTokenDTO, RefreshTokenResponseDTO> {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly refreshTokensRepository: IRefreshTokensRepository,
    private readonly jwtProvider: IJwtProvider,
    private readonly refreshTokenGenerator: IRefreshTokenGenerator,
    private readonly sessionsRepository: ISessionsRepository,
    private readonly accessTokenExpiresIn: string = '15m',
    private readonly refreshTokenExpiresInDays: number = 30,
  ) {}

  async execute(input: RefreshTokenDTO): Promise<RefreshTokenResponseDTO> {
    const tokenHash = RefreshToken.hashToken(input.refreshToken)
    const refreshToken = await this.refreshTokensRepository.findByTokenHash(tokenHash)

    if (!refreshToken || refreshToken.isRevoked() || refreshToken.isExpired()) {
      throw new InvalidRefreshToken('Refresh token inválido ou expirado')
    }

    const user = await this.usersRepository.findById(refreshToken.userId)

    if (!user || !user.active) {
      throw new InvalidRefreshToken('Refresh token inválido ou expirado')
    }

    await this.refreshTokensRepository.revoke(refreshToken)

    const newRefreshToken = this.refreshTokenGenerator.generate()
    const newRefreshTokenEntity = RefreshToken.create({
      userId: user.id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + this.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000),
    })
    await this.refreshTokensRepository.save(newRefreshTokenEntity)

    const jti = nanoid()
    const token = this.jwtProvider.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        jti,
      },
      this.accessTokenExpiresIn,
    )

    const session = Session.create({
      userId: user.id,
      jti,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })

    await this.sessionsRepository.upsertByUserId(session)

    return new RefreshTokenResponseDTO(token, newRefreshToken)
  }
}
