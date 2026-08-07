import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { GetVideoByIdUseCase } from '../../../application/get-video-by-id-use-case'
import { GetVideoByIdHandler } from './get-video-by-id-handler.ts'
import { GetVideoByIdDTO } from '../../../application/dto/get-video-by-id.dto'
import { ReturnVideoDTO } from '../../../application/dto/return-video.dto'
import { EntityNotFound } from '@shared/exceptions/index'

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
  onExecute?: (input: GetVideoByIdDTO) => void
} = {}) {
  const calls: GetVideoByIdDTO[] = []
  return {
    calls,
    execute: async (input: GetVideoByIdDTO) => {
      calls.push(input)
      overrides.onExecute?.(input)
      if (overrides.error) throw overrides.error
      return overrides.result
    },
  }
}

describe('GetVideoByIdHandler', () => {
  it('deve responder 200 com o vídeo', async () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z')
    const useCase = makeUseCase({
      result: new ReturnVideoDTO(
        'video-001',
        'https://youtu.be/dQw4w9WgXcQ',
        'dQw4w9WgXcQ',
        createdAt,
        createdAt,
        'user-001',
      ),
    })
    const handler = new GetVideoByIdHandler(useCase as unknown as GetVideoByIdUseCase)
    const reply = createMockReply()

    await handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 200)
    const sent = reply.sent as ReturnVideoDTO
    assert.strictEqual(sent.id, 'video-001')
    assert.strictEqual(sent.videoUrl, 'https://youtu.be/dQw4w9WgXcQ')
    assert.strictEqual(sent.videoId, 'dQw4w9WgXcQ')
    assert.strictEqual(sent.createdBy, 'user-001')
    assert.ok(useCase.calls[0] instanceof GetVideoByIdDTO)
    assert.strictEqual(useCase.calls[0].id, 'video-001')
  })

  it('deve responder 404 quando o vídeo não existe', async () => {
    const useCase = makeUseCase({ error: new EntityNotFound('Vídeo não encontrado') })
    const handler = new GetVideoByIdHandler(useCase as unknown as GetVideoByIdUseCase)
    const reply = createMockReply()

    await handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 404)
    assert.deepStrictEqual(reply.sent, { message: 'Vídeo não encontrado' })
  })

  it('deve relançar erros não mapeados', async () => {
    const useCase = makeUseCase({ error: new Error('erro inesperado') })
    const handler = new GetVideoByIdHandler(useCase as unknown as GetVideoByIdUseCase)
    const reply = createMockReply()

    await assert.rejects(
      handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply),
      /erro inesperado/,
    )
  })
})
