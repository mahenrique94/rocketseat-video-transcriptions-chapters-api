import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateVideoUseCase } from '../../../application/create-video-use-case'
import { CreateVideoHandler } from './create-video-handler.ts'
import { CreateVideoDTO } from '../../../application/dto/create-video.dto'
import { ReturnCreatedVideoDTO } from '../../../application/dto/return-created-video.dto'

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
  onExecute?: (input: CreateVideoDTO) => void
} = {}) {
  const calls: CreateVideoDTO[] = []
  return {
    calls,
    execute: async (input: CreateVideoDTO) => {
      calls.push(input)
      overrides.onExecute?.(input)
      if (overrides.error) throw overrides.error
      return overrides.result
    },
  }
}

describe('CreateVideoHandler', () => {
  it('deve responder 201 com o vídeo criado', async () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z')
    const useCase = makeUseCase({
      result: new ReturnCreatedVideoDTO(
        'video-001',
        'https://youtu.be/dQw4w9WgXcQ',
        'dQw4w9WgXcQ',
        createdAt,
        createdAt,
        'user-001',
      ),
    })
    const handler = new CreateVideoHandler(useCase as unknown as CreateVideoUseCase)
    const reply = createMockReply()
    const request = {
      body: { url: 'https://youtu.be/dQw4w9WgXcQ' },
      user: { id: 'user-001' },
    } as unknown as FastifyRequest

    await handler.execute(request, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 201)
    const sent = reply.sent as ReturnCreatedVideoDTO
    assert.strictEqual(sent.id, 'video-001')
    assert.strictEqual(sent.videoUrl, 'https://youtu.be/dQw4w9WgXcQ')
    assert.strictEqual(sent.videoId, 'dQw4w9WgXcQ')
    assert.strictEqual(sent.createdBy, 'user-001')
    assert.ok(useCase.calls[0] instanceof CreateVideoDTO)
    assert.strictEqual(useCase.calls[0].url, 'https://youtu.be/dQw4w9WgXcQ')
    assert.strictEqual(useCase.calls[0].createdBy, 'user-001')
  })
})
