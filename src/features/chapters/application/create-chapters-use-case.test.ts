import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { EntityNotFound, EntityAlreadyExists } from '@shared/exceptions/index'

mock.module('@features/chapters/infrastructure/ai/mastra', {
  exports: {
    chaptersMastra: {
      getAgentById: () => ({
        generate: async () => ({ text: '00:00 Introdução\n01:00 Tópico' }),
      }),
    },
  },
})

const { CreateChaptersUseCase } = await import('./create-chapters-use-case.ts')
const { VideosInMemoryRepository } = await import('../../videos/infrastructure/storage/videos-in-memory-repository.ts')
const { ChaptersInMemoryRepository } = await import('../infrastructure/storage/chapters-in-memory-repository.ts')
const { Video } = await import('../../videos/domain/video.ts')
const { Chapter } = await import('../domain/chapter.ts')

function createSeedVideo(id = 'video-001', videoId = 'dQw4w9WgXcQ') {
  return Video.toEntity({
    id,
    videoUrl: `https://youtu.be/${videoId}`,
    videoId,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    createdBy: 'user-001',
  })
}

function createSeedChapter(videoId: string) {
  return Chapter.toEntity({
    id: 'chapter-001',
    videoId,
    content: '00:00 Introdução',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    deletedAt: null,
  })
}

describe('CreateChaptersUseCase', () => {
  let videoRepository: InstanceType<typeof VideosInMemoryRepository>
  let chaptersRepository: InstanceType<typeof ChaptersInMemoryRepository>
  let useCase: InstanceType<typeof CreateChaptersUseCase>

  beforeEach(() => {
    videoRepository = new VideosInMemoryRepository()
    chaptersRepository = new ChaptersInMemoryRepository()
    useCase = new CreateChaptersUseCase(videoRepository, chaptersRepository)
  })

  it('deve gerar e persistir capítulos para um vídeo existente', async () => {
    await videoRepository.createVideo(createSeedVideo())

    const result = await useCase.execute({ videoId: 'video-001' })

    assert.strictEqual(result.videoId, 'video-001')
    assert.strictEqual(result.content, '00:00 Introdução\n01:00 Tópico')
    assert.ok(result.id)
    assert.ok(result.createdAt instanceof Date)
    assert.ok(result.updatedAt instanceof Date)

    const persisted = await chaptersRepository.getChaptersByVideoId('video-001')
    assert.ok(persisted)
    assert.strictEqual(persisted.content, '00:00 Introdução\n01:00 Tópico')
  })

  it('deve lançar EntityNotFound quando o vídeo não existe', async () => {
    await assert.rejects(
      useCase.execute({ videoId: 'video-inexistente' }),
      (error) => {
        assert.ok(error instanceof EntityNotFound)
        assert.strictEqual(error.message, 'Vídeo não encontrado')
        return true
      },
    )
  })

  it('deve lançar EntityAlreadyExists quando o vídeo já possui capítulos', async () => {
    await videoRepository.createVideo(createSeedVideo())
    await chaptersRepository.createChapters(createSeedChapter('video-001'))

    await assert.rejects(
      useCase.execute({ videoId: 'video-001' }),
      (error) => {
        assert.ok(error instanceof EntityAlreadyExists)
        assert.strictEqual(error.message, 'Vídeo já possui capítulos')
        return true
      },
    )
  })
})
