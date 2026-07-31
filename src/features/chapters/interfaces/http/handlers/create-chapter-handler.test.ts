import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateChaptersUseCase } from '../../../application/create-chapters-use-case'
import { CreateChapterHandler } from './create-chapter-handler.ts'
import { CreateChapterDTO } from '../../../application/dto/create-chapter.dto'
import { ReturnCreatedChapterDTO } from '../../../application/dto/return-created-chapter.dto'
import { EntityNotFound, EntityAlreadyExists } from '@shared/exceptions/index'

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
  onExecute?: (input: CreateChapterDTO) => void
} = {}) {
  const calls: CreateChapterDTO[] = []
  return {
    calls,
    execute: async (input: CreateChapterDTO) => {
      calls.push(input)
      overrides.onExecute?.(input)
      if (overrides.error) throw overrides.error
      return overrides.result
    },
  }
}

describe('CreateChapterHandler', () => {
  it('deve responder 201 com os capítulos criados', async () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z')
    const useCase = makeUseCase({
      result: new ReturnCreatedChapterDTO('chapter-001', 'video-001', '00:00 Introdução', createdAt, createdAt),
    })
    const handler = new CreateChapterHandler(useCase as unknown as CreateChaptersUseCase)
    const reply = createMockReply()
    const request = { params: { id: 'video-001' } } as unknown as FastifyRequest

    await handler.execute(request, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 201)
    const sent = reply.sent as { chapters: ReturnCreatedChapterDTO }
    assert.strictEqual(sent.chapters.id, 'chapter-001')
    assert.strictEqual(sent.chapters.videoId, 'video-001')
    assert.strictEqual(sent.chapters.content, '00:00 Introdução')
    assert.strictEqual(sent.chapters.createdAt, createdAt)
    assert.strictEqual(sent.chapters.updatedAt, createdAt)
    assert.ok(useCase.calls[0] instanceof CreateChapterDTO)
    assert.strictEqual(useCase.calls[0].videoId, 'video-001')
  })

  it('deve responder 404 quando o vídeo não existe', async () => {
    const useCase = makeUseCase({ error: new EntityNotFound('Vídeo não encontrado') })
    const handler = new CreateChapterHandler(useCase as unknown as CreateChaptersUseCase)
    const reply = createMockReply()

    await handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 404)
    assert.deepStrictEqual(reply.sent, { message: 'Vídeo não encontrado' })
  })

  it('deve responder 409 quando o vídeo já possui capítulos', async () => {
    const useCase = makeUseCase({ error: new EntityAlreadyExists('Vídeo já possui capítulos') })
    const handler = new CreateChapterHandler(useCase as unknown as CreateChaptersUseCase)
    const reply = createMockReply()

    await handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 409)
    assert.deepStrictEqual(reply.sent, { message: 'Vídeo já possui capítulos' })
  })

  it('deve relançar erros não mapeados', async () => {
    const useCase = makeUseCase({ error: new Error('erro inesperado') })
    const handler = new CreateChapterHandler(useCase as unknown as CreateChaptersUseCase)
    const reply = createMockReply()

    await assert.rejects(
      handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply),
      /erro inesperado/,
    )
  })
})
