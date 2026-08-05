import { compare } from 'bcrypt'
import { nanoid } from 'nanoid'
import type { IUsersRepository } from '../infrastructure/storage/users-repository'
import type { IRefreshTokensRepository } from '../infrastructure/storage/refresh-tokens-repository'
import type { ISessionsRepository } from '../infrastructure/storage/sessions-repository'
import type { UseCase } from '@shared/types/use-case'
import type { IJwtProvider } from '@shared/auth/jwt-provider'
import type { IRefreshTokenGenerator } from '@shared/auth/refresh-token-generator'
import { InvalidCredentials } from '@shared/exceptions/index'
import { RefreshToken } from '../domain/refresh-token'
import { Session } from '../domain/session'
import { SignInDTO } from './dto/sign-in.dto'
import { SignInResponseDTO } from './dto/sign-in-response.dto'

export class SignInUseCase implements UseCase<SignInDTO, SignInResponseDTO> {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly jwtProvider: IJwtProvider,
    private readonly refreshTokensRepository: IRefreshTokensRepository,
    private readonly refreshTokenGenerator: IRefreshTokenGenerator,
    private readonly sessionsRepository: ISessionsRepository,
    private readonly accessTokenExpiresIn: string = '15m',
    private readonly refreshTokenExpiresInDays: number = 30,
  ) {}

  async execute(input: SignInDTO): Promise<SignInResponseDTO> {
    const user = await this.usersRepository.findByEmail(input.email)

    if (!user) {
      throw new InvalidCredentials('Email ou senha inválidos')
    }

    const passwordMatches = await compare(input.password, user.password)

    if (!passwordMatches) {
      throw new InvalidCredentials('Email ou senha inválidos')
    }

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

    await this.sessionsRepository.revokeAllActiveByUserId(user.id)
    const session = Session.create({
      userId: user.id,
      jti,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    await this.sessionsRepository.save(session)

    const refreshToken = this.refreshTokenGenerator.generate()
    const refreshTokenEntity = RefreshToken.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + this.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000),
    })
    await this.refreshTokensRepository.save(refreshTokenEntity)

    return new SignInResponseDTO(token, refreshToken)
  }
}
