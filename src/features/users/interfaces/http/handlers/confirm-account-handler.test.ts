import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { ConfirmAccountUseCase } from '../../../application/confirm-account-use-case'
import { ConfirmAccountHandler } from './confirm-account-handler.ts'
import { ConfirmAccountDTO } from '../../../application/dto/confirm-account.dto'
import { InvalidConfirmationToken } from '@shared/exceptions/index'

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

function makeUseCase(overrides: {
  error?: unknown
  onExecute?: (input: ConfirmAccountDTO) => void
} = {}) {
  const calls: ConfirmAccountDTO[] = []
  return {
    calls,
    execute: async (input: ConfirmAccountDTO) => {
      calls.push(input)
      overrides.onExecute?.(input)
      if (overrides.error) throw overrides.error
    },
  }
}

function makeRequest(token?: string) {
  return {
    body: { token },
  } as unknown as FastifyRequest
}

describe('ConfirmAccountHandler', () => {
  it('deve responder 200 com mensagem de sucesso', async () => {
    const useCase = makeUseCase()
    const handler = new ConfirmAccountHandler(useCase as unknown as ConfirmAccountUseCase)
    const reply = createMockReply()

    await handler.execute(makeRequest('token-valido'), reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 200)
    assert.deepStrictEqual(reply.sent, { message: 'Conta confirmada com sucesso' })
    assert.ok(useCase.calls[0] instanceof ConfirmAccountDTO)
    assert.strictEqual(useCase.calls[0].token, 'token-valido')
  })

  it('deve responder 404 quando o token é inválido ou expirado', async () => {
    const useCase = makeUseCase({
      error: new InvalidConfirmationToken('Token de confirmação inválido ou expirado'),
    })
    const handler = new ConfirmAccountHandler(useCase as unknown as ConfirmAccountUseCase)
    const reply = createMockReply()

    await handler.execute(makeRequest('token-invalido'), reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 404)
    assert.deepStrictEqual(reply.sent, { message: 'Token de confirmação inválido ou expirado' })
  })

  it('deve relançar erros não mapeados', async () => {
    const useCase = makeUseCase({ error: new Error('erro inesperado') })
    const handler = new ConfirmAccountHandler(useCase as unknown as ConfirmAccountUseCase)
    const reply = createMockReply()

    await assert.rejects(
      handler.execute(makeRequest('token-valido'), reply as unknown as FastifyReply),
      /erro inesperado/,
    )
  })
})
