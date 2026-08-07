import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { GetVideosUseCase } from '../../../application/get-videos-use-case'
import { GetVideosHandler } from './get-videos-handler.ts'
import { ReturnVideoDTO } from '../../../application/dto/return-video.dto'

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
} = {}) {
  const calls: number[] = []
  return {
    calls,
    execute: async () => {
      calls.push(1)
      if (overrides.error) throw overrides.error
      return overrides.result
    },
  }
}

describe('GetVideosHandler', () => {
  it('deve responder 200 com a lista de vídeos', async () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z')
    const useCase = makeUseCase({
      result: [
        new ReturnVideoDTO(
          'video-001',
          'https://youtu.be/dQw4w9WgXcQ',
          'dQw4w9WgXcQ',
          createdAt,
          createdAt,
          'user-001',
        ),
      ],
    })
    const handler = new GetVideosHandler(useCase as unknown as GetVideosUseCase)
    const reply = createMockReply()

    await handler.execute({} as unknown as FastifyRequest, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 200)
    const sent = reply.sent as ReturnVideoDTO[]
    assert.strictEqual(sent.length, 1)
    assert.strictEqual(sent[0].id, 'video-001')
    assert.strictEqual(sent[0].videoId, 'dQw4w9WgXcQ')
    assert.strictEqual(useCase.calls.length, 1)
  })

  it('deve responder 200 com lista vazia', async () => {
    const useCase = makeUseCase({ result: [] })
    const handler = new GetVideosHandler(useCase as unknown as GetVideosUseCase)
    const reply = createMockReply()

    await handler.execute({} as unknown as FastifyRequest, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 200)
    assert.deepStrictEqual(reply.sent, [])
  })

  it('deve relançar erros não mapeados', async () => {
    const useCase = makeUseCase({ error: new Error('erro inesperado') })
    const handler = new GetVideosHandler(useCase as unknown as GetVideosUseCase)
    const reply = createMockReply()

    await assert.rejects(
      handler.execute({} as unknown as FastifyRequest, reply as unknown as FastifyReply),
      /erro inesperado/,
    )
  })
})
