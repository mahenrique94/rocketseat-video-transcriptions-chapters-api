import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { RefreshTokenUseCase } from '../../../application/refresh-token-use-case'
import { RefreshTokenHandler } from './refresh-token-handler.ts'
import { RefreshTokenDTO } from '../../../application/dto/refresh-token.dto'
import { RefreshTokenResponseDTO } from '../../../application/dto/refresh-token-response.dto'
import { InvalidRefreshToken } from '@shared/exceptions/index'

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
  onExecute?: (input: RefreshTokenDTO) => void
} = {}) {
  const calls: RefreshTokenDTO[] = []
  return {
    calls,
    execute: async (input: RefreshTokenDTO) => {
      calls.push(input)
      overrides.onExecute?.(input)
      if (overrides.error) throw overrides.error
      return overrides.result
    },
  }
}

describe('RefreshTokenHandler', () => {
  it('deve responder 200 com novo token de acesso e refresh token rotacionado', async () => {
    const useCase = makeUseCase({
      result: new RefreshTokenResponseDTO('new-jwt-token', 'new-refresh-token'),
    })
    const handler = new RefreshTokenHandler(useCase as unknown as RefreshTokenUseCase)
    const reply = createMockReply()
    const request = {
      body: {
        refreshToken: 'old-refresh-token',
      },
    } as unknown as FastifyRequest

    await handler.execute(request, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 200)
    const sent = reply.sent as RefreshTokenResponseDTO
    assert.strictEqual(sent.token, 'new-jwt-token')
    assert.strictEqual(sent.refreshToken, 'new-refresh-token')
    assert.ok(useCase.calls[0] instanceof RefreshTokenDTO)
    assert.strictEqual(useCase.calls[0].refreshToken, 'old-refresh-token')
  })

  it('deve responder 403 quando o refresh token é inválido ou expirado', async () => {
    const useCase = makeUseCase({
      error: new InvalidRefreshToken('Refresh token inválido ou expirado'),
    })
    const handler = new RefreshTokenHandler(useCase as unknown as RefreshTokenUseCase)
    const reply = createMockReply()
    const request = {
      body: {
        refreshToken: 'token-invalido',
      },
    } as unknown as FastifyRequest

    await handler.execute(request, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 403)
    assert.deepStrictEqual(reply.sent, { message: 'Refresh token inválido ou expirado' })
  })

  it('deve relançar erros não mapeados', async () => {
    const useCase = makeUseCase({ error: new Error('erro inesperado') })
    const handler = new RefreshTokenHandler(useCase as unknown as RefreshTokenUseCase)
    const reply = createMockReply()

    await assert.rejects(
      handler.execute(
        {
          body: {
            refreshToken: 'token',
          },
        } as unknown as FastifyRequest,
        reply as unknown as FastifyReply,
      ),
      /erro inesperado/,
    )
  })
})
