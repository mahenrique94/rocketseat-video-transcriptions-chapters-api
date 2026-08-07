import { describe, it, before, beforeEach, after, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'
import * as schema from '@externals/db/schema'
import { testJwtProvider, seedDbSession } from '@shared/utils/auth-test-helpers'
import { config } from '@shared/config/index'
import { Redis } from 'ioredis'

const e2eDbUrl = config.E2E_DATABASE_URL || config.DATABASE_URL

const dbAvailable = !!e2eDbUrl && !!config.REDIS_URL

let pool: pg.Pool | undefined
let testDb: ReturnType<typeof drizzle> | undefined
let redis: Redis | undefined

if (dbAvailable) {
  pool = new pg.Pool({ connectionString: e2eDbUrl })
  testDb = drizzle(pool, { schema })

  redis = new Redis(config.REDIS_URL!)

  mock.module('@shared/db/index', {
    exports: { default: testDb },
  })

  mock.module('@shared/redis/index', {
    exports: { default: redis },
  })
}

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
      getAgentById: () => ({ generate: async () => ({ text: '' }) }),
    },
  },
})

const suppressConsole = mock.method(console, 'error', () => {})
after(() => suppressConsole.mock.restore())

const { buildApp } = await import('../../../app.ts')

let createdVideoId: string | undefined

describe(
  'E2E - /api/v2/videos/:id/chapters',
  { skip: !dbAvailable ? 'DATABASE_URL not configured' : false },
  () => {
    if (!dbAvailable) return

    let app: ReturnType<typeof buildApp>
    let authHeaders: { authorization: string }
    let authUserId: string | undefined

    before(async () => {
      app = buildApp({ jwtProvider: testJwtProvider })
      await app.ready()
    })

    beforeEach(async () => {
      const seeded = await seedDbSession(testDb!, redis!, { sub: 'e2e-chapters-user', role: 'admin' })
      authHeaders = seeded.headers
      authUserId = seeded.userId
    })

    after(async () => {
      await app.close()
      if (pool) await pool.end()
      if (redis) await redis.quit()
    })

    afterEach(async () => {
      if (testDb && authUserId) {
        await testDb.delete(schema.users).where(eq(schema.users.id, authUserId))
        authUserId = undefined
      }
      if (testDb && createdVideoId) {
        await testDb.delete(schema.videoChapters).where(eq(schema.videoChapters.videoId, createdVideoId))
        await testDb.delete(schema.videos).where(eq(schema.videos.id, createdVideoId))
        createdVideoId = undefined
      }
    })

    async function inject(options: {
      method: 'GET' | 'POST' | 'DELETE'
      url: string
      body?: Record<string, unknown>
    }) {
      return app.inject({
        ...options,
        headers: authHeaders,
      })
    }

    async function createVideo() {
      const response = await inject({
        method: 'POST',
        url: '/api/v2/videos',
        body: { url: 'https://youtu.be/dQw4w9WgXcQ' },
      })

      assert.strictEqual(response.statusCode, 201)
      const video = response.json()
      createdVideoId = video.id
      return video
    }

    it('deve criar, buscar e deletar capítulos no fluxo completo', async () => {
      const video = await createVideo()

      const createRes = await inject({
        method: 'POST',
        url: `/api/v2/videos/${video.id}/chapters`,
      })
      assert.strictEqual(createRes.statusCode, 201)
      const created = createRes.json()
      assert.strictEqual(created.chapters.videoId, video.id)
      assert.strictEqual(created.chapters.content, '00:00 Introdução\n01:00 Tópico')
      assert.ok(created.chapters.id)
      assert.ok(created.chapters.createdAt)
      assert.ok(created.chapters.updatedAt)

      const getRes = await inject({
        method: 'GET',
        url: `/api/v2/videos/${video.id}/chapters`,
      })
      assert.strictEqual(getRes.statusCode, 200)
      assert.strictEqual(getRes.json().chapters.content, '00:00 Introdução\n01:00 Tópico')

      const deleteRes = await inject({
        method: 'DELETE',
        url: `/api/v2/videos/${video.id}/chapters`,
      })
      assert.strictEqual(deleteRes.statusCode, 200)
      assert.deepStrictEqual(deleteRes.json(), { message: 'Capítulos removidos com sucesso' })

      const afterDelete = await inject({
        method: 'GET',
        url: `/api/v2/videos/${video.id}/chapters`,
      })
      assert.strictEqual(afterDelete.statusCode, 404)
    })

    it('deve retornar 409 ao tentar gerar capítulos duas vezes', async () => {
      const video = await createVideo()

      await inject({
        method: 'POST',
        url: `/api/v2/videos/${video.id}/chapters`,
      })

      const response = await inject({
        method: 'POST',
        url: `/api/v2/videos/${video.id}/chapters`,
      })

      assert.strictEqual(response.statusCode, 409)
      assert.strictEqual(response.json().message, 'Vídeo já possui capítulos')
    })

    it('deve retornar 404 para vídeo inexistente', async () => {
      const response = await inject({
        method: 'GET',
        url: '/api/v2/videos/id-inexistente/chapters',
      })

      assert.strictEqual(response.statusCode, 404)
      assert.strictEqual(response.json().message, 'Vídeo não encontrado')
    })
  },
)
