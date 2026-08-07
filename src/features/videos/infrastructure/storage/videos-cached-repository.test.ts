import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import type { RedisClient } from '@shared/redis/index'
import { VideosCachedRepository } from './videos-cached-repository.ts'
import { VideosInMemoryRepository } from './videos-in-memory-repository.ts'
import { Video } from '@features/videos/domain/video'

class CountingVideosRepository extends VideosInMemoryRepository {
  getVideoByIdCalls = 0

  override async getVideoById(id: string) {
    this.getVideoByIdCalls++
    return super.getVideoById(id)
  }
}

function createVideo(id: string) {
  return Video.toEntity({
    id,
    videoUrl: `https://youtu.be/${id}`,
    videoId: id,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    createdBy: 'user-001',
  })
}

function createFakeRedis() {
  const store = new Map<string, string>()
  return {
    store,
    async get(key: string) {
      return store.get(key) ?? null
    },
    async set(key: string, value: string) {
      store.set(key, value)
      return 'OK'
    },
    async del(...keys: string[]) {
      let removed = 0
      for (const key of keys) {
        if (store.delete(key)) removed++
      }
      return removed
    },
  }
}

describe('VideosCachedRepository', () => {
  let delegate: CountingVideosRepository
  let redis: ReturnType<typeof createFakeRedis>
  let repository: VideosCachedRepository

  beforeEach(() => {
    delegate = new CountingVideosRepository()
    redis = createFakeRedis()
    repository = new VideosCachedRepository(delegate, redis as unknown as RedisClient)
  })

  it('deve buscar no banco e popular o cache na primeira leitura', async () => {
    await delegate.createVideo(createVideo('video-001'))

    const video = await repository.getVideoById('video-001')

    assert.strictEqual(video?.id, 'video-001')
    assert.strictEqual(delegate.getVideoByIdCalls, 1)
    assert.ok(redis.store.get('video:video-001'))
  })

  it('deve retornar do cache nas próximas leituras sem consultar o banco', async () => {
    await delegate.createVideo(createVideo('video-001'))

    await repository.getVideoById('video-001')
    await repository.getVideoById('video-001')

    assert.strictEqual(delegate.getVideoByIdCalls, 1)
  })

  it('deve preservar os campos de data ao ler do cache', async () => {
    await delegate.createVideo(createVideo('video-001'))

    const fromDb = await repository.getVideoById('video-001')
    const fromCache = await repository.getVideoById('video-001')

    assert.ok(fromCache?.createdAt instanceof Date)
    assert.ok(fromCache?.updatedAt instanceof Date)
    assert.strictEqual(fromCache?.createdAt.getTime(), fromDb?.createdAt.getTime())
    assert.strictEqual(fromCache?.updatedAt.getTime(), fromDb?.updatedAt.getTime())
    assert.strictEqual(fromCache?.createdBy, 'user-001')
  })

  it('deve retornar undefined para vídeo inexistente sem popular o cache', async () => {
    const video = await repository.getVideoById('video-inexistente')

    assert.strictEqual(video, undefined)
    assert.strictEqual(redis.store.has('video:video-inexistente'), false)
  })

  it('deve repassar criação e listagem para o repositório subjacente', async () => {
    const created = await repository.createVideo(createVideo('video-001'))

    assert.strictEqual(created.id, 'video-001')
    assert.strictEqual(redis.store.has('video:video-001'), false)

    const list = await repository.getVideos()
    assert.strictEqual(list.length, 1)
  })
})
