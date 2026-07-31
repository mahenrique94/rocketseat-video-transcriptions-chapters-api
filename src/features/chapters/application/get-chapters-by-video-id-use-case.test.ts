import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { EntityNotFound } from '@shared/exceptions/index'

const { GetChaptersByVideoIdUseCase } = await import('./get-chapters-by-video-id-use-case.ts')
const { VideosInMemoryRepository } = await import('../../videos/infrastructure/storage/videos-in-memory-repository.ts')
const { ChaptersInMemoryRepository } = await import('../infrastructure/storage/chapters-in-memory-repository.ts')
const { Video } = await import('../../videos/domain/video.ts')
const { Chapter } = await import('../domain/chapter.ts')

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

function createSeedChapter(videoId: string) {
  return Chapter.toEntity({
    id: 'chapter-001',
    videoId,
    content: '00:00 Introdução\n01:00 Tópico',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    deletedAt: null,
  })
}

describe('GetChaptersByVideoIdUseCase', () => {
  let videoRepository: InstanceType<typeof VideosInMemoryRepository>
  let chaptersRepository: InstanceType<typeof ChaptersInMemoryRepository>
  let useCase: InstanceType<typeof GetChaptersByVideoIdUseCase>

  beforeEach(() => {
    videoRepository = new VideosInMemoryRepository()
    chaptersRepository = new ChaptersInMemoryRepository()
    useCase = new GetChaptersByVideoIdUseCase(videoRepository, chaptersRepository)
  })

  it('deve retornar os capítulos de um vídeo existente', async () => {
    await videoRepository.createVideo(createSeedVideo())
    await chaptersRepository.createChapters(createSeedChapter('video-001'))

    const result = await useCase.execute({ videoId: 'video-001' })

    assert.strictEqual(result.id, 'chapter-001')
    assert.strictEqual(result.videoId, 'video-001')
    assert.strictEqual(result.content, '00:00 Introdução\n01:00 Tópico')
    assert.ok(result.createdAt instanceof Date)
    assert.ok(result.updatedAt instanceof Date)
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

  it('deve lançar EntityNotFound quando o vídeo não possui capítulos', async () => {
    await videoRepository.createVideo(createSeedVideo())

    await assert.rejects(
      useCase.execute({ videoId: 'video-001' }),
      (error) => {
        assert.ok(error instanceof EntityNotFound)
        assert.strictEqual(error.message, 'Capítulos não encontrados')
        return true
      },
    )
  })

  it('deve lançar EntityNotFound quando os capítulos foram deletados', async () => {
    await videoRepository.createVideo(createSeedVideo())
    const chapter = createSeedChapter('video-001')
    await chaptersRepository.createChapters(chapter)
    await chaptersRepository.softDeleteChapters('video-001')

    await assert.rejects(
      useCase.execute({ videoId: 'video-001' }),
      (error) => {
        assert.ok(error instanceof EntityNotFound)
        assert.strictEqual(error.message, 'Capítulos não encontrados')
        return true
      },
    )
  })
})
