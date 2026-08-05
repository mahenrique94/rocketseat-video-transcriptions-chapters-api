import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { SignOutUseCase } from '../../../application/sign-out-use-case'
import { SignOutHandler } from './sign-out-handler.ts'
import { SignOutDTO } from '../../../application/dto/sign-out.dto'

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

function makeUseCase(onExecute?: (input: SignOutDTO) => void) {
  const calls: SignOutDTO[] = []
  return {
    calls,
    execute: async (input: SignOutDTO) => {
      calls.push(input)
      onExecute?.(input)
    },
  }
}

describe('SignOutHandler', () => {
  it('deve responder 200 com mensagem de sucesso', async () => {
    const useCase = makeUseCase()
    const handler = new SignOutHandler(useCase as unknown as SignOutUseCase)
    const reply = createMockReply()
    const request = {
      user: {
        id: 'user-001',
        email: 'john@example.com',
        jti: 'jti-atual',
      },
    } as unknown as FastifyRequest

    await handler.execute(request, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 200)
    assert.deepStrictEqual(reply.sent, { message: 'Sessão encerrada com sucesso' })
  })

  it('deve passar o usuário e o jti para o use case', async () => {
    const useCase = makeUseCase()
    const handler = new SignOutHandler(useCase as unknown as SignOutUseCase)
    const reply = createMockReply()
    const request = {
      user: {
        id: 'user-001',
        email: 'john@example.com',
        jti: 'jti-atual',
      },
    } as unknown as FastifyRequest

    await handler.execute(request, reply as unknown as FastifyReply)

    assert.ok(useCase.calls[0] instanceof SignOutDTO)
    assert.strictEqual(useCase.calls[0].userId, 'user-001')
    assert.strictEqual(useCase.calls[0].jti, 'jti-atual')
  })
})
