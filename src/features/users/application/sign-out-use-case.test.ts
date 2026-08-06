import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { SignOutUseCase } from './sign-out-use-case.ts'
import { RefreshTokensInMemoryRepository } from '../infrastructure/storage/refresh-tokens-in-memory-repository.ts'
import { SessionsInMemoryRepository } from '../infrastructure/storage/sessions-in-memory-repository.ts'
import { RefreshToken } from '../domain/refresh-token.ts'
import { Session } from '../domain/session.ts'

describe('SignOutUseCase', () => {
  let sessionsRepository: SessionsInMemoryRepository
  let refreshTokensRepository: RefreshTokensInMemoryRepository
  let useCase: SignOutUseCase

  beforeEach(async () => {
    sessionsRepository = new SessionsInMemoryRepository()
    refreshTokensRepository = new RefreshTokensInMemoryRepository()
    useCase = new SignOutUseCase(sessionsRepository, refreshTokensRepository)
  })

  it('deve deletar a sessão atual e revogar os refresh tokens ativos do usuário', async () => {
    const session = Session.create({
      userId: 'user-001',
      jti: 'jti-atual',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    await sessionsRepository.upsertByUserId(session)

    const refreshToken = RefreshToken.create({
      userId: 'user-001',
      token: 'refresh-ativo',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })
    await refreshTokensRepository.save(refreshToken)

    await useCase.execute({ userId: 'user-001', jti: 'jti-atual' })

    const storedSession = await sessionsRepository.findByJtiHash(Session.hashJti('jti-atual'))
    const storedRefresh = await refreshTokensRepository.findByTokenHash(
      RefreshToken.hashToken('refresh-ativo'),
    )

    assert.strictEqual(storedSession, null)
    assert.ok(storedRefresh)
    assert.strictEqual(storedRefresh.isRevoked(), true)
  })

  it('deve deletar apenas a sessão do usuário e manter a de outro usuário', async () => {
    const sessionOwn = Session.create({
      userId: 'user-001',
      jti: 'jti-own',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    const sessionOther = Session.create({
      userId: 'user-002',
      jti: 'jti-other',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    await sessionsRepository.upsertByUserId(sessionOwn)
    await sessionsRepository.upsertByUserId(sessionOther)

    await useCase.execute({ userId: 'user-001', jti: 'jti-own' })

    const storedOwn = await sessionsRepository.findByJtiHash(Session.hashJti('jti-own'))
    const storedOther = await sessionsRepository.findByJtiHash(Session.hashJti('jti-other'))

    assert.strictEqual(storedOwn, null)
    assert.ok(storedOther)
    assert.strictEqual(storedOther.userId, 'user-002')
  })

  it('não deve lançar erro quando não existem sessão ou refresh tokens', async () => {
    await assert.doesNotReject(
      useCase.execute({ userId: 'user-inexistente', jti: 'jti-inexistente' }),
    )
  })
})
