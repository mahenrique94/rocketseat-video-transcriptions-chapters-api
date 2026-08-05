import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { SignInUseCase } from '../../../application/sign-in-use-case'
import { SignInHandler } from './sign-in-handler.ts'
import { SignInDTO } from '../../../application/dto/sign-in.dto'
import { SignInResponseDTO } from '../../../application/dto/sign-in-response.dto'
import { InvalidCredentials } from '@shared/exceptions/index'

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
  result?: unknown
  error?: unknown
  onExecute?: (input: SignInDTO) => void
} = {}) {
  const calls: SignInDTO[] = []
  return {
    calls,
    execute: async (input: SignInDTO) => {
      calls.push(input)
      overrides.onExecute?.(input)
      if (overrides.error) throw overrides.error
      return overrides.result
    },
  }
}

describe('SignInHandler', () => {
  it('deve responder 200 com o token de autenticação', async () => {
    const useCase = makeUseCase({
      result: new SignInResponseDTO('jwt-token', 'refresh-token'),
    })
    const handler = new SignInHandler(useCase as unknown as SignInUseCase)
    const reply = createMockReply()
    const request = {
      body: {
        email: 'john@example.com',
        password: 'secret123',
      },
    } as unknown as FastifyRequest

    await handler.execute(request, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 200)
    const sent = reply.sent as SignInResponseDTO
    assert.strictEqual(sent.token, 'jwt-token')
    assert.strictEqual(sent.refreshToken, 'refresh-token')
    assert.ok(useCase.calls[0] instanceof SignInDTO)
    assert.strictEqual(useCase.calls[0].password, 'secret123')
  })

  it('deve responder 403 quando as credenciais são inválidas', async () => {
    const useCase = makeUseCase({ error: new InvalidCredentials('Email ou senha inválidos') })
    const handler = new SignInHandler(useCase as unknown as SignInUseCase)
    const reply = createMockReply()
    const request = {
      body: {
        email: 'john@example.com',
        password: 'senha-errada',
      },
    } as unknown as FastifyRequest

    await handler.execute(request, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 403)
    assert.deepStrictEqual(reply.sent, { message: 'Email ou senha inválidos' })
  })

  it('deve relançar erros não mapeados', async () => {
    const useCase = makeUseCase({ error: new Error('erro inesperado') })
    const handler = new SignInHandler(useCase as unknown as SignInUseCase)
    const reply = createMockReply()

    await assert.rejects(
      handler.execute(
        {
          body: {
            email: 'john@example.com',
            password: 'secret123',
          },
        } as unknown as FastifyRequest,
        reply as unknown as FastifyReply,
      ),
      /erro inesperado/,
    )
  })
})
