import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { GetChaptersByVideoIdUseCase } from '../../../application/get-chapters-by-video-id-use-case'
import { GetChapterByVideoIdHandler } from './get-chapter-by-video-id-handler.ts'
import { GetChapterByVideoIdDTO } from '../../../application/dto/get-chapter-by-video-id.dto'
import { ReturnChapterDTO } from '../../../application/dto/return-chapter.dto'
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
  onExecute?: (input: GetChapterByVideoIdDTO) => void
} = {}) {
  const calls: GetChapterByVideoIdDTO[] = []
  return {
    calls,
    execute: async (input: GetChapterByVideoIdDTO) => {
      calls.push(input)
      overrides.onExecute?.(input)
      if (overrides.error) throw overrides.error
      return overrides.result
    },
  }
}

describe('GetChapterByVideoIdHandler', () => {
  it('deve responder 200 com os capítulos', async () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z')
    const useCase = makeUseCase({
      result: new ReturnChapterDTO('chapter-001', 'video-001', '00:00 Introdução', createdAt, createdAt),
    })
    const handler = new GetChapterByVideoIdHandler(useCase as unknown as GetChaptersByVideoIdUseCase)
    const reply = createMockReply()

    await handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 200)
    const sent = reply.sent as { chapters: ReturnChapterDTO }
    assert.strictEqual(sent.chapters.id, 'chapter-001')
    assert.strictEqual(sent.chapters.videoId, 'video-001')
    assert.strictEqual(sent.chapters.content, '00:00 Introdução')
    assert.strictEqual(sent.chapters.createdAt, createdAt)
    assert.strictEqual(sent.chapters.updatedAt, createdAt)
    assert.ok(useCase.calls[0] instanceof GetChapterByVideoIdDTO)
    assert.strictEqual(useCase.calls[0].videoId, 'video-001')
  })

  it('deve responder 404 quando o vídeo não existe', async () => {
    const useCase = makeUseCase({ error: new EntityNotFound('Vídeo não encontrado') })
    const handler = new GetChapterByVideoIdHandler(useCase as unknown as GetChaptersByVideoIdUseCase)
    const reply = createMockReply()

    await handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 404)
    assert.deepStrictEqual(reply.sent, { message: 'Vídeo não encontrado' })
  })

  it('deve relançar erros não mapeados', async () => {
    const useCase = makeUseCase({ error: new Error('erro inesperado') })
    const handler = new GetChapterByVideoIdHandler(useCase as unknown as GetChaptersByVideoIdUseCase)
    const reply = createMockReply()

    await assert.rejects(
      handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply),
      /erro inesperado/,
    )
  })
})
