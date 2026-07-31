import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { EntityNotFound } from '@shared/exceptions/index'

const { DeleteChaptersUseCase } = await import('./delete-chapters-use-case.ts')
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
    content: '00:00 Introdução',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    deletedAt: null,
  })
}

describe('DeleteChaptersUseCase', () => {
  let videoRepository: InstanceType<typeof VideosInMemoryRepository>
  let chaptersRepository: InstanceType<typeof ChaptersInMemoryRepository>
  let useCase: InstanceType<typeof DeleteChaptersUseCase>

  beforeEach(() => {
    videoRepository = new VideosInMemoryRepository()
    chaptersRepository = new ChaptersInMemoryRepository()
    useCase = new DeleteChaptersUseCase(videoRepository, chaptersRepository)
  })

  it('deve remover os capítulos de um vídeo existente', async () => {
    await videoRepository.createVideo(createSeedVideo())
    await chaptersRepository.createChapters(createSeedChapter('video-001'))

    const result = await useCase.execute({ videoId: 'video-001' })

    assert.strictEqual(result.message, 'Capítulos removidos com sucesso')
    assert.strictEqual(await chaptersRepository.getChaptersByVideoId('video-001'), undefined)
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
})
