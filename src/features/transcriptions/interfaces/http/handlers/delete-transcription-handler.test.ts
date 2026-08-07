import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { DeleteTranscriptionUseCase } from '../../../application/delete-transcription-use-case'
import { DeleteTranscriptionHandler } from './delete-transcription-handler.ts'
import { DeleteTranscriptionDTO } from '../../../application/dto/delete-transcription.dto'
import { ReturnDeletedTranscriptionDTO } from '../../../application/dto/return-deleted-transcription.dto'
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
  onExecute?: (input: DeleteTranscriptionDTO) => void
} = {}) {
  const calls: DeleteTranscriptionDTO[] = []
  return {
    calls,
    execute: async (input: DeleteTranscriptionDTO) => {
      calls.push(input)
      overrides.onExecute?.(input)
      if (overrides.error) throw overrides.error
      return overrides.result
    },
  }
}

describe('DeleteTranscriptionHandler', () => {
  it('deve responder 200 com a mensagem de sucesso', async () => {
    const useCase = makeUseCase({ result: new ReturnDeletedTranscriptionDTO('Transcrição removida com sucesso') })
    const handler = new DeleteTranscriptionHandler(useCase as unknown as DeleteTranscriptionUseCase)
    const reply = createMockReply()

    await handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 200)
    const sent = reply.sent as ReturnDeletedTranscriptionDTO
    assert.strictEqual(sent.message, 'Transcrição removida com sucesso')
    assert.ok(useCase.calls[0] instanceof DeleteTranscriptionDTO)
    assert.strictEqual(useCase.calls[0].videoId, 'video-001')
  })

  it('deve responder 404 quando o vídeo não existe', async () => {
    const useCase = makeUseCase({ error: new EntityNotFound('Vídeo não encontrado') })
    const handler = new DeleteTranscriptionHandler(useCase as unknown as DeleteTranscriptionUseCase)
    const reply = createMockReply()

    await handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 404)
    assert.deepStrictEqual(reply.sent, { message: 'Vídeo não encontrado' })
  })

  it('deve responder 404 quando não há transcrição', async () => {
    const useCase = makeUseCase({ error: new EntityNotFound('Transcrição não encontrada') })
    const handler = new DeleteTranscriptionHandler(useCase as unknown as DeleteTranscriptionUseCase)
    const reply = createMockReply()

    await handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 404)
    assert.deepStrictEqual(reply.sent, { message: 'Transcrição não encontrada' })
  })

  it('deve relançar erros não mapeados', async () => {
    const useCase = makeUseCase({ error: new Error('erro inesperado') })
    const handler = new DeleteTranscriptionHandler(useCase as unknown as DeleteTranscriptionUseCase)
    const reply = createMockReply()

    await assert.rejects(
      handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply),
      /erro inesperado/,
    )
  })
})
