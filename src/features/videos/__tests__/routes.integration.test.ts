import { describe, it, beforeEach, afterEach, after, mock } from 'node:test'
import assert from 'node:assert/strict'
import { DrizzleQueryError } from 'drizzle-orm/errors'
import { DatabaseError } from 'pg'
import type { IVideosRepository } from '../infrastructure/storage/videos-repository.ts'
import { Video } from '@features/videos/domain/video'
import { VideosInMemoryRepository } from '@features/videos/infrastructure/storage/videos-in-memory-repository'

const suppressConsole = mock.method(console, 'error', () => {})
after(() => suppressConsole.mock.restore())

mock.module('@shared/db/index', {
  exports: { default: {} },
})

mock.module('@features/chapters/infrastructure/ai/mastra', {
  exports: {
    chaptersMastra: {
      getAgentById: () => ({ generate: async () => ({ text: '' }) }),
    },
  },
})

mock.module('@features/transcriptions/infrastructure/ai/mastra', {
  exports: {
    transcriptionsMastra: {
      getAgentById: () => ({ generate: async () => ({ text: '' }) }),
    },
  },
})

const { buildApp } = await import('../../../app.ts')

function seedVideo(videoRepository: IVideosRepository, id: string, createdAt: Date) {
  return videoRepository.createVideo(
    Video.toEntity({
      id,
      videoUrl: `https://youtu.be/${id}`,
      videoId: id,
      createdAt,
      updatedAt: createdAt,
      createdBy: 'user-001',
    }),
  )
}

describe('/api/v2/videos', () => {
  let app: ReturnType<typeof buildApp>
  let videoRepository: VideosInMemoryRepository

  beforeEach(async () => {
    videoRepository = new VideosInMemoryRepository()
    app = buildApp({ videoRepository })
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  it('GET - deve retornar lista vazia com status 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v2/videos',
    })

    assert.strictEqual(response.statusCode, 200)
    assert.deepStrictEqual(response.json(), [])
  })

  it('GET - deve retornar lista de vídeos ordenada por criação', async () => {
    await seedVideo(videoRepository, 'video-001', new Date('2024-01-01T00:00:00.000Z'))
    await seedVideo(videoRepository, 'video-002', new Date('2024-01-02T00:00:00.000Z'))

    const response = await app.inject({
      method: 'GET',
      url: '/api/v2/videos',
    })

    assert.strictEqual(response.statusCode, 200)
    const body = response.json()
    assert.strictEqual(body.length, 2)
    assert.strictEqual(body[0].id, 'video-001')
    assert.strictEqual(body[1].id, 'video-002')
  })

  it('GET /:id - deve retornar vídeo existente com status 200', async () => {
    await seedVideo(videoRepository, 'video-001', new Date('2024-01-01T00:00:00.000Z'))

    const response = await app.inject({
      method: 'GET',
      url: '/api/v2/videos/video-001',
    })

    assert.strictEqual(response.statusCode, 200)
    const body = response.json()
    assert.strictEqual(body.id, 'video-001')
    assert.strictEqual(body.videoUrl, 'https://youtu.be/video-001')
    assert.strictEqual(body.videoId, 'video-001')
    assert.strictEqual(body.createdBy, 'user-001')
  })

  it('GET /:id - deve retornar 404 para ID inexistente', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v2/videos/id-inexistente',
    })

    assert.strictEqual(response.statusCode, 404)
    assert.strictEqual(response.json().message, 'Vídeo não encontrado')
  })

  it('POST - deve criar vídeo com URL válida e retornar 201', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v2/videos',
      body: { url: 'https://youtu.be/dQw4w9WgXcQ' },
    })

    assert.strictEqual(response.statusCode, 201)
    const body = response.json()
    assert.strictEqual(body.videoUrl, 'https://youtu.be/dQw4w9WgXcQ')
    assert.strictEqual(body.videoId, 'dQw4w9WgXcQ')
    assert.ok(body.id)
    assert.strictEqual(body.createdBy, 'user-001')
  })

  it('POST - deve persistir o vídeo criado', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v2/videos',
      body: { url: 'https://youtu.be/dQw4w9WgXcQ' },
    })

    const created = createResponse.json()

    const getResponse = await app.inject({
      method: 'GET',
      url: `/api/v2/videos/${created.id}`,
    })

    assert.strictEqual(getResponse.statusCode, 200)
    assert.strictEqual(getResponse.json().id, created.id)
    assert.strictEqual(getResponse.json().videoId, 'dQw4w9WgXcQ')
  })

  it('POST - deve retornar 400 para URL inválida', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v2/videos',
      body: { url: 'not-a-valid-url' },
    })

    assert.strictEqual(response.statusCode, 400)
    assert.strictEqual(response.json().message, 'Validation error')
  })

  it('POST - deve retornar 400 para corpo vazio', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v2/videos',
      body: {},
    })

    assert.strictEqual(response.statusCode, 400)
    assert.strictEqual(response.json().message, 'Validation error')
  })

  it('POST - deve mapear erro de banco duplicado para 409', async () => {
    const throwingRepository: IVideosRepository = {
      getVideos: async () => [],
      getVideoById: async () => undefined,
      createVideo: async () => {
        const pgError = new DatabaseError('duplicate key', 0, 'error')
        pgError.code = '23505'
        pgError.detail = 'Key (id) already exists'
        throw new DrizzleQueryError('INSERT INTO videos', [], pgError)
      },
    }

    const throwingApp = buildApp({ videoRepository: throwingRepository })
    await throwingApp.ready()

    try {
      const response = await throwingApp.inject({
        method: 'POST',
        url: '/api/v2/videos',
        body: { url: 'https://youtu.be/dQw4w9WgXcQ' },
      })

      assert.strictEqual(response.statusCode, 409)
      assert.strictEqual(response.json().message, 'Registro duplicado')
    } finally {
      await throwingApp.close()
    }
  })

  it('POST - deve retornar 500 para erro não mapeado', async () => {
    const throwingRepository: IVideosRepository = {
      getVideos: async () => [],
      getVideoById: async () => undefined,
      createVideo: async () => {
        throw new Error('falha inesperada')
      },
    }

    const throwingApp = buildApp({ videoRepository: throwingRepository })
    await throwingApp.ready()

    try {
      const response = await throwingApp.inject({
        method: 'POST',
        url: '/api/v2/videos',
        body: { url: 'https://youtu.be/dQw4w9WgXcQ' },
      })

      assert.strictEqual(response.statusCode, 500)
      assert.strictEqual(response.json().message, 'falha inesperada')
    } finally {
      await throwingApp.close()
    }
  })
})
