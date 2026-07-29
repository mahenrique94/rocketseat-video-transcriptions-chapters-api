import { describe, it, before, after, mock } from 'node:test'
import assert from 'node:assert/strict'

const suppressConsole = mock.method(console, 'error', () => {})
after(() => suppressConsole.mock.restore())

const mockVideos = [
  {
    id: 'video-001',
    videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    createdBy: 'user-001',
  },
  {
    id: 'video-002',
    videoUrl: 'https://youtu.be/abc123def45',
    videoId: 'abc123def45',
    createdAt: new Date('2024-01-02T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    createdBy: 'user-001',
  },
]

mock.module('../db/videos.ts', {
  exports: {
    getVideos: async () => mockVideos,
    getVideoById: async (id: string) => mockVideos.find((v) => v.id === id),
    createVideo: async (videoUrl: string, videoId: string, userId: string) => ({
      id: 'new-video',
      videoUrl,
      videoId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    }),
  },
})

const { buildApp } = await import('../app.ts')

describe('GET /api/v2/videos', () => {
  let app: ReturnType<typeof buildApp>

  before(async () => {
    app = buildApp()
    await app.ready()
  })

  after(async () => {
    await app.close()
  })

  it('deve retornar lista de vídeos com status 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v2/videos',
    })

    assert.strictEqual(response.statusCode, 200)
    const body = JSON.parse(response.body)
    assert.strictEqual(body.length, 2)
    assert.strictEqual(body[0].id, 'video-001')
    assert.strictEqual(body[1].id, 'video-002')
  })
})

describe('GET /api/v2/videos/:id', () => {
  let app: ReturnType<typeof buildApp>

  before(async () => {
    app = buildApp()
    await app.ready()
  })

  after(async () => {
    await app.close()
  })

  it('deve retornar vídeo existente com status 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v2/videos/video-001',
    })

    assert.strictEqual(response.statusCode, 200)
    const body = JSON.parse(response.body)
    assert.strictEqual(body.id, 'video-001')
    assert.strictEqual(body.videoUrl, 'https://youtu.be/dQw4w9WgXcQ')
    assert.strictEqual(body.videoId, 'dQw4w9WgXcQ')
    assert.strictEqual(body.createdBy, 'user-001')
  })

  it('deve retornar 404 para ID inexistente', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v2/videos/id-inexistente',
    })

    assert.strictEqual(response.statusCode, 404)
    const body = JSON.parse(response.body)
    assert.strictEqual(body.message, 'Vídeo não encontrado')
  })
})

describe('POST /api/v2/videos', () => {
  let app: ReturnType<typeof buildApp>

  before(async () => {
    app = buildApp()
    await app.ready()
  })

  after(async () => {
    await app.close()
  })

  it('deve criar vídeo com URL válida e retornar 201', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v2/videos',
      body: { url: 'https://youtu.be/dQw4w9WgXcQ' },
    })

    assert.strictEqual(response.statusCode, 201)
    const body = JSON.parse(response.body)
    assert.strictEqual(body.videoUrl, 'https://youtu.be/dQw4w9WgXcQ')
    assert.strictEqual(body.videoId, 'dQw4w9WgXcQ')
    assert.ok(body.id)
    assert.strictEqual(body.createdBy, 'user-001')
  })

  it('deve retornar 400 para URL inválida', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v2/videos',
      body: { url: 'not-a-valid-url' },
    })

    assert.strictEqual(response.statusCode, 400)
    const body = JSON.parse(response.body)
    assert.strictEqual(body.message, 'Validation error')
  })

  it('deve retornar 400 para corpo vazio', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v2/videos',
      body: {},
    })

    assert.strictEqual(response.statusCode, 400)
    const body = JSON.parse(response.body)
    assert.strictEqual(body.message, 'Validation error')
  })
})
