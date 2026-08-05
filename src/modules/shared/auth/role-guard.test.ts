import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { RoleGuard } from './role-guard.ts'
import type { UserPayload } from '@shared/types/fastify'

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

function makeRequest(method: string, url: string, role: UserPayload['role']) {
  return {
    method,
    url,
    user: { id: 'user-001', email: 'mock@example.com', jti: 'jti-123', role },
  } as unknown as FastifyRequest
}

describe('RoleGuard', () => {
  const guard = new RoleGuard()

  it('deve permitir GET para usuário comum', async () => {
    const reply = createMockReply()

    await guard.execute(makeRequest('GET', '/api/v2/videos', 'user'), reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 200)
    assert.strictEqual(reply.sent, undefined)
  })

  it('deve permitir GET para administrador', async () => {
    const reply = createMockReply()

    await guard.execute(makeRequest('GET', '/api/v2/videos', 'admin'), reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 200)
    assert.strictEqual(reply.sent, undefined)
  })

  it('deve responder 403 para POST de usuário comum', async () => {
    const reply = createMockReply()

    await guard.execute(makeRequest('POST', '/api/v2/videos', 'user'), reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 403)
    assert.deepStrictEqual(reply.sent, { message: 'Acesso restrito a administradores' })
  })

  it('deve responder 403 para DELETE de usuário comum', async () => {
    const reply = createMockReply()

    await guard.execute(
      makeRequest('DELETE', '/api/v2/videos/video-001/chapters', 'user'),
      reply as unknown as FastifyReply,
    )

    assert.strictEqual(reply.statusCode, 403)
  })

  it('deve responder 403 para PUT e PATCH de usuário comum', async () => {
    for (const method of ['PUT', 'PATCH']) {
      const reply = createMockReply()

      await guard.execute(makeRequest(method, '/api/v2/videos', 'user'), reply as unknown as FastifyReply)

      assert.strictEqual(reply.statusCode, 403, `method ${method}`)
    }
  })

  it('deve permitir POST para administrador', async () => {
    const reply = createMockReply()

    await guard.execute(makeRequest('POST', '/api/v2/videos', 'admin'), reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 200)
    assert.strictEqual(reply.sent, undefined)
  })

  it('deve permitir DELETE para administrador', async () => {
    const reply = createMockReply()

    await guard.execute(
      makeRequest('DELETE', '/api/v2/videos/video-001/chapters', 'admin'),
      reply as unknown as FastifyReply,
    )

    assert.strictEqual(reply.statusCode, 200)
    assert.strictEqual(reply.sent, undefined)
  })

  it('deve ignorar rotas isentas mesmo para usuário comum', async () => {
    const guardWithExemptions = new RoleGuard(['/api/v1/auth/sign-out'])
    const reply = createMockReply()

    await guardWithExemptions.execute(
      makeRequest('POST', '/api/v1/auth/sign-out', 'user'),
      reply as unknown as FastifyReply,
    )

    assert.strictEqual(reply.statusCode, 200)
    assert.strictEqual(reply.sent, undefined)
  })
})
