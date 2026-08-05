import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { hash } from 'bcrypt'
import { InvalidRefreshToken } from '@shared/exceptions/index'
import type { IJwtProvider } from '@shared/auth/jwt-provider'
import type { IRefreshTokenGenerator } from '@shared/auth/refresh-token-generator'
import { RefreshTokenUseCase } from './refresh-token-use-case.ts'
import { UsersInMemoryRepository } from '../infrastructure/storage/users-in-memory-repository.ts'
import { RefreshTokensInMemoryRepository } from '../infrastructure/storage/refresh-tokens-in-memory-repository.ts'
import { SessionsInMemoryRepository } from '../infrastructure/storage/sessions-in-memory-repository.ts'
import { User } from '../domain/user.ts'
import { RefreshToken } from '../domain/refresh-token.ts'
import { Session } from '../domain/session.ts'

describe('RefreshTokenUseCase', () => {
  let usersRepository: UsersInMemoryRepository
  let refreshTokensRepository: RefreshTokensInMemoryRepository
  let sessionsRepository: SessionsInMemoryRepository
  let jwtProvider: IJwtProvider
  let refreshTokenGenerator: IRefreshTokenGenerator
  let useCase: RefreshTokenUseCase

  beforeEach(async () => {
    usersRepository = new UsersInMemoryRepository()
    refreshTokensRepository = new RefreshTokensInMemoryRepository()
    sessionsRepository = new SessionsInMemoryRepository()
    jwtProvider = {
      sign: (payload) => `token-${payload.sub}`,
      verify: <T>() => ({} as T),
    }
    refreshTokenGenerator = {
      generate: () => 'new-refresh-token-value',
    }
    useCase = new RefreshTokenUseCase(
      usersRepository,
      refreshTokensRepository,
      jwtProvider,
      refreshTokenGenerator,
      sessionsRepository,
    )
  })

  async function seedUser(overrides: { active?: boolean } = {}) {
    const passwordHash = await hash('secret123', 10)
    let user = User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: passwordHash,
    })
    if (overrides.active === false) {
      user = new User(
        user.id,
        user.firstName,
        user.lastName,
        user.email,
        user.password,
        user.createdAt,
        user.updatedAt,
        false,
        user.deletedAt,
        user.role,
      )
    }
    await usersRepository.createUser(user)
    return user
  }

  async function seedRefreshToken(userId: string, token = 'refresh-token-value') {
    const refreshToken = RefreshToken.create({
      userId,
      token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })
    await refreshTokensRepository.save(refreshToken)
    return refreshToken
  }

  it('deve emitir novo token de acesso e rotacionar o refresh token', async () => {
    const user = await seedUser()
    await seedRefreshToken(user.id)

    const result = await useCase.execute({
      refreshToken: 'refresh-token-value',
    })

    assert.strictEqual(result.token, `token-${user.id}`)
    assert.strictEqual(result.refreshToken, 'new-refresh-token-value')
  })

  it('deve revogar o refresh token antigo e persistir o novo', async () => {
    const user = await seedUser()
    await seedRefreshToken(user.id)

    await useCase.execute({
      refreshToken: 'refresh-token-value',
    })

    const oldToken = await refreshTokensRepository.findByTokenHash(
      RefreshToken.hashToken('refresh-token-value'),
    )
    const newToken = await refreshTokensRepository.findByTokenHash(
      RefreshToken.hashToken('new-refresh-token-value'),
    )

    assert.ok(oldToken)
    assert.strictEqual(oldToken.isRevoked(), true)
    assert.ok(newToken)
    assert.strictEqual(newToken.isRevoked(), false)
    assert.strictEqual(newToken.userId, user.id)
  })

  it('deve assinar o novo token com jti e criar uma sessão ativa', async () => {
    const user = await seedUser()
    await seedRefreshToken(user.id)

    let jti: string | undefined
    jwtProvider.sign = (payload) => {
      jti = payload.jti
      return 'token'
    }

    await useCase.execute({
      refreshToken: 'refresh-token-value',
    })

    const session = await sessionsRepository.findByJtiHash(Session.hashJti(jti!))
    assert.ok(session)
    assert.strictEqual(session.userId, user.id)
    assert.strictEqual(session.isRevoked(), false)
  })

  it('deve revogar a sessão anterior ao renovar o token (uma sessão por usuário)', async () => {
    const user = await seedUser()
    await seedRefreshToken(user.id)

    const oldSession = Session.create({
      userId: user.id,
      jti: 'jti-anterior',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    await sessionsRepository.save(oldSession)

    await useCase.execute({
      refreshToken: 'refresh-token-value',
    })

    const storedOldSession = await sessionsRepository.findByJtiHash(Session.hashJti('jti-anterior'))
    assert.ok(storedOldSession)
    assert.strictEqual(storedOldSession.isRevoked(), true)
  })

  it('deve lançar InvalidRefreshToken quando o token não existe', async () => {
    await assert.rejects(
      useCase.execute({
        refreshToken: 'token-inexistente',
      }),
      (error) => {
        assert.ok(error instanceof InvalidRefreshToken)
        assert.strictEqual(error.message, 'Refresh token inválido ou expirado')
        return true
      },
    )
  })

  it('deve lançar InvalidRefreshToken quando o token já foi revogado', async () => {
    const user = await seedUser()
    const refreshToken = await seedRefreshToken(user.id)
    await refreshTokensRepository.revoke(refreshToken)

    await assert.rejects(
      useCase.execute({
        refreshToken: 'refresh-token-value',
      }),
      (error) => {
        assert.ok(error instanceof InvalidRefreshToken)
        return true
      },
    )
  })

  it('deve lançar InvalidRefreshToken quando o token está expirado', async () => {
    const user = await seedUser()
    const refreshToken = RefreshToken.create({
      userId: user.id,
      token: 'refresh-token-value',
      expiresAt: new Date(Date.now() - 1000),
    })
    await refreshTokensRepository.save(refreshToken)

    await assert.rejects(
      useCase.execute({
        refreshToken: 'refresh-token-value',
      }),
      (error) => {
        assert.ok(error instanceof InvalidRefreshToken)
        return true
      },
    )
  })

  it('deve lançar InvalidRefreshToken quando o usuário não existe mais', async () => {
    await seedRefreshToken('usuario-inexistente')

    await assert.rejects(
      useCase.execute({
        refreshToken: 'refresh-token-value',
      }),
      (error) => {
        assert.ok(error instanceof InvalidRefreshToken)
        return true
      },
    )
  })

  it('deve lançar InvalidRefreshToken quando o usuário está inativo', async () => {
    const user = await seedUser({ active: false })
    await seedRefreshToken(user.id)

    await assert.rejects(
      useCase.execute({
        refreshToken: 'refresh-token-value',
      }),
      (error) => {
        assert.ok(error instanceof InvalidRefreshToken)
        return true
      },
    )
  })
})
