import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { GetTranscriptionByVideoIdUseCase } from '../../../application/get-transcription-by-video-id-use-case'
import { GetTranscriptionByVideoIdHandler } from './get-transcription-by-video-id-handler.ts'
import { GetTranscriptionByVideoIdDTO } from '../../../application/dto/get-transcription-by-video-id.dto'
import { ReturnTranscriptionDTO } from '../../../application/dto/return-transcription.dto'
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
  onExecute?: (input: GetTranscriptionByVideoIdDTO) => void
} = {}) {
  const calls: GetTranscriptionByVideoIdDTO[] = []
  return {
    calls,
    execute: async (input: GetTranscriptionByVideoIdDTO) => {
      calls.push(input)
      overrides.onExecute?.(input)
      if (overrides.error) throw overrides.error
      return overrides.result
    },
  }
}

describe('GetTranscriptionByVideoIdHandler', () => {
  it('deve responder 200 com a transcrição', async () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z')
    const useCase = makeUseCase({
      result: new ReturnTranscriptionDTO(
        'transcription-001',
        'video-001',
        'transcrição fictícia do vídeo',
        createdAt,
        createdAt,
      ),
    })
    const handler = new GetTranscriptionByVideoIdHandler(useCase as unknown as GetTranscriptionByVideoIdUseCase)
    const reply = createMockReply()

    await handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 200)
    const sent = reply.sent as { transcription: ReturnTranscriptionDTO }
    assert.strictEqual(sent.transcription.id, 'transcription-001')
    assert.strictEqual(sent.transcription.videoId, 'video-001')
    assert.strictEqual(sent.transcription.content, 'transcrição fictícia do vídeo')
    assert.strictEqual(sent.transcription.createdAt, createdAt)
    assert.strictEqual(sent.transcription.updatedAt, createdAt)
    assert.ok(useCase.calls[0] instanceof GetTranscriptionByVideoIdDTO)
    assert.strictEqual(useCase.calls[0].videoId, 'video-001')
  })

  it('deve responder 404 quando o vídeo não existe', async () => {
    const useCase = makeUseCase({ error: new EntityNotFound('Vídeo não encontrado') })
    const handler = new GetTranscriptionByVideoIdHandler(useCase as unknown as GetTranscriptionByVideoIdUseCase)
    const reply = createMockReply()

    await handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 404)
    assert.deepStrictEqual(reply.sent, { message: 'Vídeo não encontrado' })
  })

  it('deve responder 404 quando o vídeo não possui transcrição', async () => {
    const useCase = makeUseCase({ error: new EntityNotFound('Transcrição não encontrada') })
    const handler = new GetTranscriptionByVideoIdHandler(useCase as unknown as GetTranscriptionByVideoIdUseCase)
    const reply = createMockReply()

    await handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 404)
    assert.deepStrictEqual(reply.sent, { message: 'Transcrição não encontrada' })
  })

  it('deve relançar erros não mapeados', async () => {
    const useCase = makeUseCase({ error: new Error('erro inesperado') })
    const handler = new GetTranscriptionByVideoIdHandler(useCase as unknown as GetTranscriptionByVideoIdUseCase)
    const reply = createMockReply()

    await assert.rejects(
      handler.execute({ params: { id: 'video-001' } } as unknown as FastifyRequest, reply as unknown as FastifyReply),
      /erro inesperado/,
    )
  })
})
