import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { DeleteChaptersUseCase } from '../../../application/delete-chapters-use-case'
import { DeleteChapterHandler } from './delete-chapter-handler.ts'
import { DeleteChapterDTO } from '../../../application/dto/delete-chapter.dto'
import { ReturnDeletedChapterDTO } from '../../../application/dto/return-deleted-chapter.dto'
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
  onExecute?: (input: DeleteChapterDTO) => void
} = {}) {
  const calls: DeleteChapterDTO[] = []
  return {
    calls,
    execute: async (input: DeleteChapterDTO) => {
      calls.push(input)
      overrides.onExecute?.(input)
      if (overrides.error) throw overrides.error
      return overrides.result
    },
  }
}

describe('DeleteChapterHandler', () => {
  it('deve responder 200 com a mensagem de sucesso', async () => {
    const useCase = makeUseCase({ result: new ReturnDeletedChapterDTO('Capítulos removidos com sucesso') })
    const handler = new DeleteChapterHandler(useCase as unknown as DeleteChaptersUseCase)
    const reply = createMockReply()

    await handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 200)
    const sent = reply.sent as ReturnDeletedChapterDTO
    assert.strictEqual(sent.message, 'Capítulos removidos com sucesso')
    assert.ok(useCase.calls[0] instanceof DeleteChapterDTO)
    assert.strictEqual(useCase.calls[0].videoId, 'video-001')
  })

  it('deve responder 404 quando o vídeo não existe', async () => {
    const useCase = makeUseCase({ error: new EntityNotFound('Vídeo não encontrado') })
    const handler = new DeleteChapterHandler(useCase as unknown as DeleteChaptersUseCase)
    const reply = createMockReply()

    await handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 404)
    assert.deepStrictEqual(reply.sent, { message: 'Vídeo não encontrado' })
  })

  it('deve responder 404 quando não há capítulos', async () => {
    const useCase = makeUseCase({ error: new EntityNotFound('Capítulos não encontrados') })
    const handler = new DeleteChapterHandler(useCase as unknown as DeleteChaptersUseCase)
    const reply = createMockReply()

    await handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 404)
    assert.deepStrictEqual(reply.sent, { message: 'Capítulos não encontrados' })
  })

  it('deve relançar erros não mapeados', async () => {
    const useCase = makeUseCase({ error: new Error('erro inesperado') })
    const handler = new DeleteChapterHandler(useCase as unknown as DeleteChaptersUseCase)
    const reply = createMockReply()

    await assert.rejects(
      handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply),
      /erro inesperado/,
    )
  })
})
