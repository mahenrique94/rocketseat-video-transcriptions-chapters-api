import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { EntityNotFound } from '@shared/exceptions/index'

const { GetVideoByIdUseCase } = await import('./get-video-by-id-use-case.ts')
const { VideosInMemoryRepository } = await import('../infrastructure/storage/videos-in-memory-repository.ts')
const { Video } = await import('../domain/video.ts')

function createSeedVideo(id = 'video-001') {
  return Video.toEntity({
    id,
    videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    createdBy: 'user-001',
  })
}

describe('GetVideoByIdUseCase', () => {
  let videoRepository: InstanceType<typeof VideosInMemoryRepository>
  let useCase: InstanceType<typeof GetVideoByIdUseCase>

  beforeEach(() => {
    videoRepository = new VideosInMemoryRepository()
    useCase = new GetVideoByIdUseCase(videoRepository)
  })

  it('deve retornar o vídeo de um ID existente', async () => {
    await videoRepository.createVideo(createSeedVideo())

    const result = await useCase.execute({ id: 'video-001' })

    assert.strictEqual(result.id, 'video-001')
    assert.strictEqual(result.videoUrl, 'https://youtu.be/dQw4w9WgXcQ')
    assert.strictEqual(result.videoId, 'dQw4w9WgXcQ')
    assert.strictEqual(result.createdBy, 'user-001')
    assert.ok(result.createdAt instanceof Date)
    assert.ok(result.updatedAt instanceof Date)
  })

  it('deve lançar EntityNotFound quando o vídeo não existe', async () => {
    await assert.rejects(
      useCase.execute({ id: 'video-inexistente' }),
      (error) => {
        assert.ok(error instanceof EntityNotFound)
        assert.strictEqual(error.message, 'Vídeo não encontrado')
        return true
      },
    )
  })
})
