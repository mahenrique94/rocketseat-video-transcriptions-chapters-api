import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { AuthGuard } from './auth-guard.ts'
import { testJwtProvider } from '@shared/utils/auth-test-helpers'
import { SessionsInMemoryRepository } from '@features/users/infrastructure/storage/sessions-in-memory-repository'
import { UsersInMemoryRepository } from '@features/users/infrastructure/storage/users-in-memory-repository'
import { Session } from '@features/users/domain/session'
import { User } from '@features/users/domain/user'

interface MockReply {
  statusCode: number
  sent: unknown
  status(code: number): MockReply
  send(payload: unknown): MockReply
}

function createMockReply(): MockReply {
  let statusCode = 200
  let sent: unknown
  const reply: MockReply = {
    get statusCode() {
      return statusCode
    },
    get sent() {
      return sent
    },
    status(code: number) {
      statusCode = code
      return reply
    },
    send(payload: unknown) {
      sent = payload
      return reply
    },
  }
  return reply
}

function makeRequest(headers: Record<string, string | undefined> = {}) {
  return {
    headers,
  } as unknown as FastifyRequest
}

describe('AuthGuard', () => {
  let sessionsRepository: SessionsInMemoryRepository
  let usersRepository: UsersInMemoryRepository
  let guard: AuthGuard

  beforeEach(async () => {
    sessionsRepository = new SessionsInMemoryRepository()
    usersRepository = new UsersInMemoryRepository()
    guard = new AuthGuard(testJwtProvider, sessionsRepository, usersRepository)
  })

  async function seedSessionFor(sub: string, jti: string, options: { expired?: boolean; active?: boolean } = {}) {
    const user = User.toEntity({
      id: sub,
      firstName: 'John',
      lastName: 'Doe',
      email: `guard-${sub}@example.com`,
      password: 'hash-nao-utilizado',
      createdAt: new Date(),
      updatedAt: new Date(),
      active: options.active !== false,
      deletedAt: null,
      role: 'user',
      confirmationTokenHash: null,
      confirmationTokenExpiresAt: null,
    })
    await usersRepository.createUser(user)

    const session = Session.create({
      userId: sub,
      jti,
      expiresAt: options.expired
        ? new Date(Date.now() - 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    await sessionsRepository.upsertByUserId(session)
  }

  it('deve responder 404 quando o header Authorization não está presente', async () => {
    const reply = createMockReply()

    await guard.execute(makeRequest(), reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 404)
    assert.deepStrictEqual(reply.sent, { message: 'Not found' })
  })

  it('deve responder 404 quando o header não usa o esquema Bearer', async () => {
    const reply = createMockReply()

    await guard.execute(
      makeRequest({ authorization: 'Basic abc123' }),
      reply as unknown as FastifyReply,
    )

    assert.strictEqual(reply.statusCode, 404)
    assert.deepStrictEqual(reply.sent, { message: 'Not found' })
  })

  it('deve responder 404 quando o token é inválido', async () => {
    const reply = createMockReply()

    await guard.execute(
      makeRequest({ authorization: 'Bearer token-invalido' }),
      reply as unknown as FastifyReply,
    )

    assert.strictEqual(reply.statusCode, 404)
    assert.deepStrictEqual(reply.sent, { message: 'Not found' })
  })

  it('deve responder 404 quando não existe sessão para o token', async () => {
    const reply = createMockReply()
    const token = testJwtProvider.sign({ sub: 'user-123', email: 'john@example.com', role: 'user', jti: 'jti-sem-sessao' })

    await guard.execute(
      makeRequest({ authorization: `Bearer ${token}` }),
      reply as unknown as FastifyReply,
    )

    assert.strictEqual(reply.statusCode, 404)
    assert.deepStrictEqual(reply.sent, { message: 'Not found' })
  })

  it('deve responder 404 quando a sessão está expirada', async () => {
    await seedSessionFor('user-123', 'jti-expirado', { expired: true })
    const reply = createMockReply()
    const token = testJwtProvider.sign({ sub: 'user-123', email: 'john@example.com', role: 'user', jti: 'jti-expirado' })

    await guard.execute(
      makeRequest({ authorization: `Bearer ${token}` }),
      reply as unknown as FastifyReply,
    )

    assert.strictEqual(reply.statusCode, 404)
    assert.deepStrictEqual(reply.sent, { message: 'Not found' })
  })

  it('deve responder 404 quando a conta do usuário está inativa', async () => {
    await seedSessionFor('user-123', 'jti-inativo', { active: false })
    const reply = createMockReply()
    const token = testJwtProvider.sign({ sub: 'user-123', email: 'john@example.com', role: 'user', jti: 'jti-inativo' })

    await guard.execute(
      makeRequest({ authorization: `Bearer ${token}` }),
      reply as unknown as FastifyReply,
    )

    assert.strictEqual(reply.statusCode, 404)
    assert.deepStrictEqual(reply.sent, { message: 'Not found' })
  })

  it('deve responder 404 quando a sessão pertence a outro usuário', async () => {
    await seedSessionFor('user-outro', 'jti-123')
    const reply = createMockReply()
    const token = testJwtProvider.sign({ sub: 'user-123', email: 'john@example.com', role: 'user', jti: 'jti-123' })

    await guard.execute(
      makeRequest({ authorization: `Bearer ${token}` }),
      reply as unknown as FastifyReply,
    )

    assert.strictEqual(reply.statusCode, 404)
    assert.deepStrictEqual(reply.sent, { message: 'Not found' })
  })

  it('deve injetar o usuário no request quando token e sessão são válidos', async () => {
    await seedSessionFor('user-123', 'jti-123')
    const reply = createMockReply()
    const token = testJwtProvider.sign({ sub: 'user-123', email: 'john@example.com', role: 'user', jti: 'jti-123' })
    const request = makeRequest({ authorization: `Bearer ${token}` })

    await guard.execute(request, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 200)
    assert.strictEqual(reply.sent, undefined)
    assert.deepStrictEqual(request.user, {
      id: 'user-123',
      email: 'john@example.com',
      jti: 'jti-123',
      role: 'user',
    })
  })
})
