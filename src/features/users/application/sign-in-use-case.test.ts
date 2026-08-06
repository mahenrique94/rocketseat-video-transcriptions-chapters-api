import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { hash } from 'bcrypt'
import { InvalidCredentials } from '@shared/exceptions/index'
import type { IJwtProvider } from '@shared/auth/jwt-provider'
import type { IRefreshTokenGenerator } from '@shared/auth/refresh-token-generator'
import { SignInUseCase } from './sign-in-use-case.ts'
import { UsersInMemoryRepository } from '../infrastructure/storage/users-in-memory-repository.ts'
import { RefreshTokensInMemoryRepository } from '../infrastructure/storage/refresh-tokens-in-memory-repository.ts'
import { SessionsInMemoryRepository } from '../infrastructure/storage/sessions-in-memory-repository.ts'
import { User } from '../domain/user.ts'
import { RefreshToken } from '../domain/refresh-token.ts'
import { Session } from '../domain/session.ts'

describe('SignInUseCase', () => {
  let usersRepository: UsersInMemoryRepository
  let refreshTokensRepository: RefreshTokensInMemoryRepository
  let sessionsRepository: SessionsInMemoryRepository
  let jwtProvider: IJwtProvider
  let refreshTokenGenerator: IRefreshTokenGenerator
  let useCase: SignInUseCase

  beforeEach(async () => {
    usersRepository = new UsersInMemoryRepository()
    refreshTokensRepository = new RefreshTokensInMemoryRepository()
    sessionsRepository = new SessionsInMemoryRepository()
    jwtProvider = {
      sign: (payload) => `token-${payload.sub}`,
      verify: <T>() => ({} as T),
    }
    refreshTokenGenerator = {
      generate: () => 'refresh-token-value',
    }
    useCase = new SignInUseCase(
      usersRepository,
      jwtProvider,
      refreshTokensRepository,
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
    if (overrides.active !== false) {
      user = user.activate()
    }
    await usersRepository.createUser(user)
    return user
  }

  it('deve autenticar com e-mail e senha corretos e retornar um token', async () => {
    const user = await seedUser()

    const result = await useCase.execute({
      email: 'john@example.com',
      password: 'secret123',
    })

    assert.strictEqual(result.token, `token-${user.id}`)
  })

  it('deve assinar o token com sub, email, jti e role do usuário autenticado', async () => {
    const user = await seedUser()

    let signedPayload: { sub: string; email: string; jti: string; role: string } | undefined
    jwtProvider.sign = (payload) => {
      signedPayload = payload
      return 'token'
    }

    await useCase.execute({
      email: 'john@example.com',
      password: 'secret123',
    })

    assert.strictEqual(signedPayload?.sub, user.id)
    assert.strictEqual(signedPayload?.email, 'john@example.com')
    assert.ok(signedPayload?.jti)
    assert.strictEqual(signedPayload?.role, 'user')
  })

  it('deve retornar um refresh token junto com o token de acesso', async () => {
    await seedUser()

    const result = await useCase.execute({
      email: 'john@example.com',
      password: 'secret123',
    })

    assert.strictEqual(result.refreshToken, 'refresh-token-value')
  })

  it('deve persistir o refresh token associado ao usuário', async () => {
    const user = await seedUser()

    await useCase.execute({
      email: 'john@example.com',
      password: 'secret123',
    })

    const stored = await refreshTokensRepository.findByTokenHash(
      RefreshToken.hashToken('refresh-token-value'),
    )
    assert.ok(stored)
    assert.strictEqual(stored.userId, user.id)
    assert.strictEqual(stored.isRevoked(), false)
  })

  it('deve criar uma sessão ativa para o usuário', async () => {
    const user = await seedUser()

    let jti: string | undefined
    jwtProvider.sign = (payload) => {
      jti = payload.jti
      return 'token'
    }

    await useCase.execute({
      email: 'john@example.com',
      password: 'secret123',
    })

    const session = await sessionsRepository.findByJtiHash(Session.hashJti(jti!))
    assert.ok(session)
    assert.strictEqual(session.userId, user.id)
  })

  it('deve substituir a sessão anterior ao fazer um novo login (uma sessão por usuário)', async () => {
    await seedUser()

    const signedJtis: string[] = []
    jwtProvider.sign = (payload) => {
      signedJtis.push(payload.jti)
      return 'token'
    }

    await useCase.execute({
      email: 'john@example.com',
      password: 'secret123',
    })
    await useCase.execute({
      email: 'john@example.com',
      password: 'secret123',
    })

    const firstSession = await sessionsRepository.findByJtiHash(Session.hashJti(signedJtis[0]))
    const secondSession = await sessionsRepository.findByJtiHash(Session.hashJti(signedJtis[1]))

    assert.strictEqual(firstSession, null)
    assert.ok(secondSession)
    assert.strictEqual(secondSession.userId, (await usersRepository.findByEmail('john@example.com'))!.id)
  })

  it('deve lançar InvalidCredentials quando o e-mail não existe', async () => {
    await assert.rejects(
      useCase.execute({
        email: 'nao-existe@example.com',
        password: 'secret123',
      }),
      (error) => {
        assert.ok(error instanceof InvalidCredentials)
        assert.strictEqual(error.message, 'Email ou senha inválidos')
        return true
      },
    )
  })

  it('deve lançar InvalidCredentials quando a senha está incorreta', async () => {
    await seedUser()

    await assert.rejects(
      useCase.execute({
        email: 'john@example.com',
        password: 'senha-errada',
      }),
      (error) => {
        assert.ok(error instanceof InvalidCredentials)
        assert.strictEqual(error.message, 'Email ou senha inválidos')
        return true
      },
    )
  })

  it('deve lançar InvalidCredentials quando a conta ainda não está ativa', async () => {
    await seedUser({ active: false })

    await assert.rejects(
      useCase.execute({
        email: 'john@example.com',
        password: 'secret123',
      }),
      (error) => {
        assert.ok(error instanceof InvalidCredentials)
        assert.strictEqual(error.message, 'Email ou senha inválidos')
        return true
      },
    )
  })
})
