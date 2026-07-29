import { describe, it, before, after, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '../db/schema.ts'

const e2eDbUrl =
  process.env.E2E_DATABASE_URL ||
  process.env.DATABASE_URL

const dbAvailable = !!e2eDbUrl

let pool: pg.Pool | undefined
let testDb: ReturnType<typeof drizzle> | undefined

if (dbAvailable) {
  pool = new pg.Pool({ connectionString: e2eDbUrl })
  testDb = drizzle(pool, { schema })

  mock.module('../db/index.ts', {
    exports: { default: testDb },
  })
}

const suppressConsole = mock.method(console, 'error', () => {})
after(() => suppressConsole.mock.restore())

const { buildApp } = await import('../app.ts')

describe('E2E - /api/v2/videos', { skip: !dbAvailable ? 'DATABASE_URL not configured' : false }, () => {
  if (!dbAvailable) return

  let app: ReturnType<typeof buildApp>

  before(async () => {
    app = buildApp()
    await app.ready()
  })

  after(async () => {
    await app.close()
    if (pool) await pool.end()
  })

  afterEach(async () => {
    if (testDb) await testDb.delete(schema.videos)
  })

  function inject(options: {
    method: 'GET' | 'POST'
    url: string
    body?: Record<string, unknown>
  }) {
    return app.inject(options)
  }

  it('GET /api/v2/videos - deve retornar lista vazia', async () => {
    const response = await inject({ method: 'GET', url: '/api/v2/videos' })

    assert.strictEqual(response.statusCode, 200)
    assert.deepStrictEqual(response.json(), [])
  })

  it('POST /api/v2/videos - deve criar vídeo com URL do YouTube', async () => {
    const response = await inject({
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
    assert.ok(body.createdAt)
    assert.ok(body.updatedAt)
  })

  it('POST /api/v2/videos - deve retornar 400 para URL inválida', async () => {
    const response = await inject({
      method: 'POST',
      url: '/api/v2/videos',
      body: { url: 'not-a-url' },
    })

    assert.strictEqual(response.statusCode, 400)
    assert.strictEqual(response.json().message, 'Validation error')
  })

  it('POST /api/v2/videos - deve retornar 400 para corpo vazio', async () => {
    const response = await inject({
      method: 'POST',
      url: '/api/v2/videos',
      body: {},
    })

    assert.strictEqual(response.statusCode, 400)
    assert.strictEqual(response.json().message, 'Validation error')
  })

  it('GET /api/v2/videos - deve retornar lista com vídeos cadastrados', async () => {
    await inject({
      method: 'POST',
      url: '/api/v2/videos',
      body: { url: 'https://youtu.be/dQw4w9WgXcQ' },
    })

    const response = await inject({ method: 'GET', url: '/api/v2/videos' })

    assert.strictEqual(response.statusCode, 200)
    const body = response.json()
    assert.strictEqual(body.length, 1)
    assert.strictEqual(body[0].videoId, 'dQw4w9WgXcQ')
  })

  it('GET /api/v2/videos/:id - deve retornar vídeo por ID', async () => {
    const createRes = await inject({
      method: 'POST',
      url: '/api/v2/videos',
      body: { url: 'https://youtu.be/dQw4w9WgXcQ' },
    })

    const response = await inject({
      method: 'GET',
      url: `/api/v2/videos/${createRes.json().id}`,
    })

    assert.strictEqual(response.statusCode, 200)
    const body = response.json()
    assert.strictEqual(body.id, createRes.json().id)
    assert.strictEqual(body.videoUrl, 'https://youtu.be/dQw4w9WgXcQ')
    assert.strictEqual(body.videoId, 'dQw4w9WgXcQ')
  })

  it('GET /api/v2/videos/:id - deve retornar 404 para ID inexistente', async () => {
    const response = await inject({
      method: 'GET',
      url: '/api/v2/videos/id-inexistente',
    })

    assert.strictEqual(response.statusCode, 404)
    assert.strictEqual(response.json().message, 'Vídeo não encontrado')
  })
})
