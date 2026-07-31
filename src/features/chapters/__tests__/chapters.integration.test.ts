import { describe, it, beforeEach, afterEach, after, mock } from 'node:test'
import assert from 'node:assert/strict'
import { Video } from '@features/videos/domain/video'
import { Chapter } from '@features/chapters/domain/chapter'
import { VideosInMemoryRepository } from '@features/videos/infrastructure/storage/videos-in-memory-repository'
import { ChaptersInMemoryRepository } from '@features/chapters/infrastructure/storage/chapters-in-memory-repository'
import type { IVideosRepository } from '@features/videos/infrastructure/storage/videos-repository'
import type { IChaptersRepository } from '../infrastructure/storage/chapters-repository'

const suppressConsole = mock.method(console, 'error', () => {})
after(() => suppressConsole.mock.restore())

mock.module('@shared/db/index', {
  exports: { default: {} },
})

mock.module('@features/chapters/infrastructure/ai/mastra', {
  exports: {
    chaptersMastra: {
      getAgentById: () => ({
        generate: async () => ({ text: '00:00 Introdução\n01:00 Tópico' }),
      }),
    },
  },
})

mock.module('@features/transcriptions/infrastructure/ai/mastra', {
  exports: {
    transcriptionsMastra: {
      getAgentById: () => ({
        generate: async () => ({ text: 'transcrição fictícia' }),
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

function seedChapters(chaptersRepository: IChaptersRepository, videoId: string) {
  return chaptersRepository.createChapters(
    Chapter.toEntity({
      id: 'chapter-001',
      videoId,
      content: '00:00 Introdução\n01:00 Tópico',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      deletedAt: null,
    }),
  )
}

describe('Chapters - /api/v2/videos/:id/chapters', () => {
  let app: ReturnType<typeof buildApp>
  let videoRepository: VideosInMemoryRepository
  let chaptersRepository: ChaptersInMemoryRepository

  beforeEach(async () => {
    videoRepository = new VideosInMemoryRepository()
    chaptersRepository = new ChaptersInMemoryRepository()
    app = buildApp({ videoRepository, chaptersRepository })
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  describe('POST', () => {
    it('deve gerar capítulos e retornar 201', async () => {
      await seedVideo(videoRepository)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v2/videos/video-001/chapters',
      })

      assert.strictEqual(response.statusCode, 201)
      const body = response.json()
      assert.strictEqual(body.chapters.videoId, 'video-001')
      assert.strictEqual(body.chapters.content, '00:00 Introdução\n01:00 Tópico')
      assert.ok(body.chapters.id)
      assert.ok(body.chapters.createdAt)
      assert.ok(body.chapters.updatedAt)
    })

    it('deve retornar 404 para vídeo inexistente', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v2/videos/video-inexistente/chapters',
      })

      assert.strictEqual(response.statusCode, 404)
      assert.strictEqual(response.json().message, 'Vídeo não encontrado')
    })

    it('deve retornar 409 quando o vídeo já possui capítulos', async () => {
      await seedVideo(videoRepository)
      await seedChapters(chaptersRepository, 'video-001')

      const response = await app.inject({
        method: 'POST',
        url: '/api/v2/videos/video-001/chapters',
      })

      assert.strictEqual(response.statusCode, 409)
      assert.strictEqual(response.json().message, 'Vídeo já possui capítulos')
    })
  })

  describe('GET', () => {
    it('deve retornar os capítulos com status 200', async () => {
      await seedVideo(videoRepository)
      await seedChapters(chaptersRepository, 'video-001')

      const response = await app.inject({
        method: 'GET',
        url: '/api/v2/videos/video-001/chapters',
      })

      assert.strictEqual(response.statusCode, 200)
      const body = response.json()
      assert.strictEqual(body.chapters.id, 'chapter-001')
      assert.strictEqual(body.chapters.videoId, 'video-001')
      assert.strictEqual(body.chapters.content, '00:00 Introdução\n01:00 Tópico')
    })

    it('deve retornar 404 para vídeo inexistente', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v2/videos/video-inexistente/chapters',
      })

      assert.strictEqual(response.statusCode, 404)
      assert.strictEqual(response.json().message, 'Vídeo não encontrado')
    })

    it('deve retornar 404 quando o vídeo não possui capítulos', async () => {
      await seedVideo(videoRepository)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v2/videos/video-001/chapters',
      })

      assert.strictEqual(response.statusCode, 404)
      assert.strictEqual(response.json().message, 'Capítulos não encontrados')
    })

    it('deve retornar 404 após exclusão (soft delete)', async () => {
      await seedVideo(videoRepository)
      await seedChapters(chaptersRepository, 'video-001')
      await chaptersRepository.softDeleteChapters('video-001')

      const response = await app.inject({
        method: 'GET',
        url: '/api/v2/videos/video-001/chapters',
      })

      assert.strictEqual(response.statusCode, 404)
      assert.strictEqual(response.json().message, 'Capítulos não encontrados')
    })
  })

  describe('DELETE', () => {
    it('deve remover os capítulos e retornar 200', async () => {
      await seedVideo(videoRepository)
      await seedChapters(chaptersRepository, 'video-001')

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v2/videos/video-001/chapters',
      })

      assert.strictEqual(response.statusCode, 200)
      assert.deepStrictEqual(response.json(), { message: 'Capítulos removidos com sucesso' })

      const afterDelete = await app.inject({
        method: 'GET',
        url: '/api/v2/videos/video-001/chapters',
      })
      assert.strictEqual(afterDelete.statusCode, 404)
    })

    it('deve retornar 404 para vídeo inexistente', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v2/videos/video-inexistente/chapters',
      })

      assert.strictEqual(response.statusCode, 404)
      assert.strictEqual(response.json().message, 'Vídeo não encontrado')
    })

    it('deve retornar 404 quando o vídeo não possui capítulos', async () => {
      await seedVideo(videoRepository)

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v2/videos/video-001/chapters',
      })

      assert.strictEqual(response.statusCode, 404)
      assert.strictEqual(response.json().message, 'Capítulos não encontrados')
    })
  })
})
