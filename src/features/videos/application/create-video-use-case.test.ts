import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

const { CreateVideoUseCase } = await import('./create-video-use-case.ts')
const { VideosInMemoryRepository } = await import('../infrastructure/storage/videos-in-memory-repository.ts')
const { InMemoryVideoProcessingQueue } = await import('../infrastructure/queue/in-memory-video-processing-queue.ts')

describe('CreateVideoUseCase', () => {
  let videoRepository: InstanceType<typeof VideosInMemoryRepository>
  let videoProcessingQueue: InstanceType<typeof InMemoryVideoProcessingQueue>
  let useCase: InstanceType<typeof CreateVideoUseCase>

  beforeEach(() => {
    videoRepository = new VideosInMemoryRepository()
    videoProcessingQueue = new InMemoryVideoProcessingQueue()
    useCase = new CreateVideoUseCase(videoRepository, videoProcessingQueue)
  })

  it('deve extrair o videoId da URL e persistir o vídeo', async () => {
    const result = await useCase.execute({
      url: 'https://youtu.be/dQw4w9WgXcQ',
      createdBy: 'user-001',
    })

    assert.strictEqual(result.videoUrl, 'https://youtu.be/dQw4w9WgXcQ')
    assert.strictEqual(result.videoId, 'dQw4w9WgXcQ')
    assert.strictEqual(result.createdBy, 'user-001')
    assert.ok(result.id)
    assert.ok(result.createdAt instanceof Date)
    assert.ok(result.updatedAt instanceof Date)

    const persisted = await videoRepository.getVideoById(result.id)
    assert.ok(persisted)
    assert.strictEqual(persisted.videoId, 'dQw4w9WgXcQ')
    assert.strictEqual(persisted.createdBy, 'user-001')
  })

  it('deve extrair o videoId de uma URL completa do YouTube', async () => {
    const result = await useCase.execute({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      createdBy: 'user-001',
    })

    assert.strictEqual(result.videoId, 'dQw4w9WgXcQ')
  })

  it('deve enfileirar jobs de transcrição e capítulos fire-and-forget', async () => {
    const result = await useCase.execute({
      url: 'https://youtu.be/dQw4w9WgXcQ',
      createdBy: 'user-001',
    })

    assert.deepStrictEqual(videoProcessingQueue.transcriptionJobs, [result.id])
    assert.deepStrictEqual(videoProcessingQueue.chaptersJobs, [result.id])
  })
})
