import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateTranscriptionUseCase } from '../../../application/create-transcription-use-case'
import { CreateTranscriptionHandler } from './create-transcription-handler.ts'
import { CreateTranscriptionDTO } from '../../../application/dto/create-transcription.dto'
import { ReturnCreatedTranscriptionDTO } from '../../../application/dto/return-created-transcription.dto'
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
  onExecute?: (input: CreateTranscriptionDTO) => void
} = {}) {
  const calls: CreateTranscriptionDTO[] = []
  return {
    calls,
    execute: async (input: CreateTranscriptionDTO) => {
      calls.push(input)
      overrides.onExecute?.(input)
      if (overrides.error) throw overrides.error
      return overrides.result
    },
  }
}

describe('CreateTranscriptionHandler', () => {
  it('deve responder 201 com a transcrição criada', async () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z')
    const useCase = makeUseCase({
      result: new ReturnCreatedTranscriptionDTO(
        'transcription-001',
        'video-001',
        'transcrição fictícia do vídeo',
        createdAt,
        createdAt,
      ),
    })
    const handler = new CreateTranscriptionHandler(useCase as unknown as CreateTranscriptionUseCase)
    const reply = createMockReply()
    const request = { params: { id: 'video-001' } } as unknown as FastifyRequest

    await handler.execute(request, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 201)
    const sent = reply.sent as { transcription: ReturnCreatedTranscriptionDTO }
    assert.strictEqual(sent.transcription.id, 'transcription-001')
    assert.strictEqual(sent.transcription.videoId, 'video-001')
    assert.strictEqual(sent.transcription.content, 'transcrição fictícia do vídeo')
    assert.strictEqual(sent.transcription.createdAt, createdAt)
    assert.strictEqual(sent.transcription.updatedAt, createdAt)
    assert.ok(useCase.calls[0] instanceof CreateTranscriptionDTO)
    assert.strictEqual(useCase.calls[0].videoId, 'video-001')
  })

  it('deve responder 404 quando o vídeo não existe', async () => {
    const useCase = makeUseCase({ error: new EntityNotFound('Vídeo não encontrado') })
    const handler = new CreateTranscriptionHandler(useCase as unknown as CreateTranscriptionUseCase)
    const reply = createMockReply()

    await handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 404)
    assert.deepStrictEqual(reply.sent, { message: 'Vídeo não encontrado' })
  })

  it('deve responder 409 quando o vídeo já possui transcrição', async () => {
    const useCase = makeUseCase({ error: new EntityAlreadyExists('Vídeo já possui uma transcrição') })
    const handler = new CreateTranscriptionHandler(useCase as unknown as CreateTranscriptionUseCase)
    const reply = createMockReply()

    await handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 409)
    assert.deepStrictEqual(reply.sent, { message: 'Vídeo já possui uma transcrição' })
  })

  it('deve relançar erros não mapeados', async () => {
    const useCase = makeUseCase({ error: new Error('erro inesperado') })
    const handler = new CreateTranscriptionHandler(useCase as unknown as CreateTranscriptionUseCase)
    const reply = createMockReply()

    await assert.rejects(
      handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply),
      /erro inesperado/,
    )
  })
})
