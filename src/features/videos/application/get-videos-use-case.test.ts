import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

const { GetVideosUseCase } = await import('./get-videos-use-case.ts')
const { VideosInMemoryRepository } = await import('../infrastructure/storage/videos-in-memory-repository.ts')
const { Video } = await import('../domain/video.ts')

function createSeedVideo(id: string, createdAt: Date) {
  return Video.toEntity({
    id,
    videoUrl: `https://youtu.be/${id}`,
    videoId: id,
    createdAt,
    updatedAt: createdAt,
    createdBy: 'user-001',
  })
}

describe('GetVideosUseCase', () => {
  let videoRepository: InstanceType<typeof VideosInMemoryRepository>
  let useCase: InstanceType<typeof GetVideosUseCase>

  beforeEach(() => {
    videoRepository = new VideosInMemoryRepository()
    useCase = new GetVideosUseCase(videoRepository)
  })

  it('deve retornar a lista de vídeos ordenada por criação', async () => {
    await videoRepository.createVideo(createSeedVideo('video-001', new Date('2024-01-01T00:00:00.000Z')))
    await videoRepository.createVideo(createSeedVideo('video-002', new Date('2024-01-02T00:00:00.000Z')))

    const result = await useCase.execute()

    assert.strictEqual(result.length, 2)
    assert.strictEqual(result[0].id, 'video-001')
    assert.strictEqual(result[1].id, 'video-002')
    assert.strictEqual(result[0].createdBy, 'user-001')
    assert.ok(result[0].createdAt instanceof Date)
    assert.ok(result[0].updatedAt instanceof Date)
  })

  it('deve retornar lista vazia quando não há vídeos', async () => {
    const result = await useCase.execute()

    assert.deepStrictEqual(result, [])
  })
})
