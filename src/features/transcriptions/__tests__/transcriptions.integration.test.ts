import { describe, it, beforeEach, afterEach, after, mock } from 'node:test'
import assert from 'node:assert/strict'
import { Video } from '@features/videos/domain/video'
import { Transcription } from '@features/transcriptions/domain/transcription'
import { VideosInMemoryRepository } from '@features/videos/infrastructure/storage/videos-in-memory-repository'
import { TranscriptionsInMemoryRepository } from '@features/transcriptions/infrastructure/storage/transcriptions-in-memory-repository'
import type { IVideosRepository } from '@features/videos/infrastructure/storage/videos-repository'
import type { ITranscriptionsRepository } from '../infrastructure/storage/transcriptions-repository'
import { testJwtProvider, seedSession } from '@shared/utils/auth-test-helpers'
import { SessionsInMemoryRepository } from '@features/users/infrastructure/storage/sessions-in-memory-repository'
import { UsersInMemoryRepository } from '@features/users/infrastructure/storage/users-in-memory-repository'

const suppressConsole = mock.method(console, 'error', () => {})
after(() => suppressConsole.mock.restore())

mock.module('@shared/db/index', {
  exports: { default: {} },
})

mock.module('@features/transcriptions/infrastructure/ai/mastra', {
  exports: {
    transcriptionsMastra: {
      getAgentById: () => ({
        generate: async () => ({ text: 'transcrição fictícia do vídeo' }),
      }),
    },
  },
})

mock.module('@features/chapters/infrastructure/ai/mastra', {
  exports: {
    chaptersMastra: {
      getAgentById: () => ({
        generate: async () => ({ text: '00:00 Introdução' }),
      }),
    },
  },
})

const { buildApp } = await import('../../../app.ts')

function seedVideo(videoRepository: IVideosRepository, id = 'video-001') {
  return videoRepository.createVideo(
    Video.toEntity({
      id,
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
      videoId: 'dQw4w9WgXcQ',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdBy: 'user-001',
    }),
  )
}

function seedTranscription(transcriptionsRepository: ITranscriptionsRepository, videoId: string) {
  return transcriptionsRepository.createTranscription(
    Transcription.toEntity({
      id: 'transcription-001',
      videoId,
      content: 'transcrição fictícia do vídeo',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      deletedAt: null,
    }),
  )
}

describe('Transcriptions - /api/v2/videos/:id/transcriptions', () => {
  let app: ReturnType<typeof buildApp>
  let videoRepository: VideosInMemoryRepository
  let transcriptionsRepository: TranscriptionsInMemoryRepository
  let sessionsRepository: SessionsInMemoryRepository
  let usersRepository: UsersInMemoryRepository
  let authHeaders: { authorization: string }
  let adminHeaders: { authorization: string }

  beforeEach(async () => {
    videoRepository = new VideosInMemoryRepository()
    transcriptionsRepository = new TranscriptionsInMemoryRepository()
    sessionsRepository = new SessionsInMemoryRepository()
    usersRepository = new UsersInMemoryRepository()
    authHeaders = (await seedSession(sessionsRepository, {}, usersRepository)).headers
    adminHeaders = (await seedSession(sessionsRepository, { sub: 'admin-001', role: 'admin' }, usersRepository)).headers
    app = buildApp({ videoRepository, transcriptionsRepository, sessionsRepository, usersRepository, jwtProvider: testJwtProvider })
    await app.ready()
  })

  function inject(options: {
    method: 'GET' | 'POST' | 'DELETE'
    url: string
  }, headers: { authorization: string } = authHeaders) {
    return app.inject({
      ...options,
      headers,
    })
  }

  afterEach(async () => {
    await app.close()
  })

  describe('POST', () => {
    it('deve gerar transcrição e retornar 201', async () => {
      await seedVideo(videoRepository)

      const response = await inject({
        method: 'POST',
        url: '/api/v2/videos/video-001/transcriptions',
      }, adminHeaders)

      assert.strictEqual(response.statusCode, 201)
      const body = response.json()
      assert.strictEqual(body.transcription.videoId, 'video-001')
      assert.strictEqual(body.transcription.content, 'transcrição fictícia do vídeo')
      assert.ok(body.transcription.id)
      assert.ok(body.transcription.createdAt)
      assert.ok(body.transcription.updatedAt)
    })

    it('deve retornar 404 para vídeo inexistente', async () => {
      const response = await inject({
        method: 'POST',
        url: '/api/v2/videos/video-inexistente/transcriptions',
      }, adminHeaders)

      assert.strictEqual(response.statusCode, 404)
      assert.strictEqual(response.json().message, 'Vídeo não encontrado')
    })

    it('deve retornar 409 quando o vídeo já possui transcrição', async () => {
      await seedVideo(videoRepository)
      await seedTranscription(transcriptionsRepository, 'video-001')

      const response = await inject({
        method: 'POST',
        url: '/api/v2/videos/video-001/transcriptions',
      }, adminHeaders)

      assert.strictEqual(response.statusCode, 409)
      assert.strictEqual(response.json().message, 'Vídeo já possui uma transcrição')
    })
  })

  describe('GET', () => {
    it('deve retornar a transcrição com status 200', async () => {
      await seedVideo(videoRepository)
      await seedTranscription(transcriptionsRepository, 'video-001')

      const response = await inject({
        method: 'GET',
        url: '/api/v2/videos/video-001/transcriptions',
      })

      assert.strictEqual(response.statusCode, 200)
      const body = response.json()
      assert.strictEqual(body.transcription.id, 'transcription-001')
      assert.strictEqual(body.transcription.videoId, 'video-001')
      assert.strictEqual(body.transcription.content, 'transcrição fictícia do vídeo')
    })

    it('deve retornar 404 para vídeo inexistente', async () => {
      const response = await inject({
        method: 'GET',
        url: '/api/v2/videos/video-inexistente/transcriptions',
      })

      assert.strictEqual(response.statusCode, 404)
      assert.strictEqual(response.json().message, 'Vídeo não encontrado')
    })

    it('deve retornar 404 quando o vídeo não possui transcrição', async () => {
      await seedVideo(videoRepository)

      const response = await inject({
        method: 'GET',
        url: '/api/v2/videos/video-001/transcriptions',
      })

      assert.strictEqual(response.statusCode, 404)
      assert.strictEqual(response.json().message, 'Transcrição não encontrada')
    })

    it('deve retornar 404 após exclusão (soft delete)', async () => {
      await seedVideo(videoRepository)
      await seedTranscription(transcriptionsRepository, 'video-001')
      await transcriptionsRepository.softDeleteTranscription('video-001')

      const response = await inject({
        method: 'GET',
        url: '/api/v2/videos/video-001/transcriptions',
      })

      assert.strictEqual(response.statusCode, 404)
      assert.strictEqual(response.json().message, 'Transcrição não encontrada')
    })
  })

  describe('DELETE', () => {
    it('deve remover a transcrição e retornar 200', async () => {
      await seedVideo(videoRepository)
      await seedTranscription(transcriptionsRepository, 'video-001')

      const response = await inject({
        method: 'DELETE',
        url: '/api/v2/videos/video-001/transcriptions',
      }, adminHeaders)

      assert.strictEqual(response.statusCode, 200)
      assert.deepStrictEqual(response.json(), { message: 'Transcrição removida com sucesso' })

      const afterDelete = await inject({
        method: 'GET',
        url: '/api/v2/videos/video-001/transcriptions',
      })
      assert.strictEqual(afterDelete.statusCode, 404)
    })

    it('deve retornar 404 para vídeo inexistente', async () => {
      const response = await inject({
        method: 'DELETE',
        url: '/api/v2/videos/video-inexistente/transcriptions',
      }, adminHeaders)

      assert.strictEqual(response.statusCode, 404)
      assert.strictEqual(response.json().message, 'Vídeo não encontrado')
    })

    it('deve retornar 404 quando o vídeo não possui transcrição', async () => {
      await seedVideo(videoRepository)

      const response = await inject({
        method: 'DELETE',
        url: '/api/v2/videos/video-001/transcriptions',
      }, adminHeaders)

      assert.strictEqual(response.statusCode, 404)
      assert.strictEqual(response.json().message, 'Transcrição não encontrada')
    })
  })

  it('DELETE - deve retornar 404 para usuário comum', async () => {
    const response = await inject({
      method: 'DELETE',
      url: '/api/v2/videos/video-001/transcriptions',
    })

    assert.strictEqual(response.statusCode, 404)
    assert.strictEqual(response.json().message, 'Not found')
  })
})
