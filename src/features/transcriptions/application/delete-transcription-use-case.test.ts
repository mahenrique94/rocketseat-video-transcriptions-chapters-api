import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { EntityNotFound } from '@shared/exceptions/index'

const { DeleteTranscriptionUseCase } = await import('./delete-transcription-use-case.ts')
const { VideosInMemoryRepository } = await import('../../videos/infrastructure/storage/videos-in-memory-repository.ts')
const { TranscriptionsInMemoryRepository } = await import('../infrastructure/storage/transcriptions-in-memory-repository.ts')
const { Video } = await import('../../videos/domain/video.ts')
const { Transcription } = await import('../domain/transcription.ts')

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

function createSeedTranscription(videoId: string) {
  return Transcription.toEntity({
    id: 'transcription-001',
    videoId,
    content: 'transcrição fictícia do vídeo',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    deletedAt: null,
  })
}

describe('DeleteTranscriptionUseCase', () => {
  let videoRepository: InstanceType<typeof VideosInMemoryRepository>
  let transcriptionsRepository: InstanceType<typeof TranscriptionsInMemoryRepository>
  let useCase: InstanceType<typeof DeleteTranscriptionUseCase>

  beforeEach(() => {
    videoRepository = new VideosInMemoryRepository()
    transcriptionsRepository = new TranscriptionsInMemoryRepository()
    useCase = new DeleteTranscriptionUseCase(videoRepository, transcriptionsRepository)
  })

  it('deve remover a transcrição de um vídeo existente', async () => {
    await videoRepository.createVideo(createSeedVideo())
    await transcriptionsRepository.createTranscription(createSeedTranscription('video-001'))

    const result = await useCase.execute({ videoId: 'video-001' })

    assert.strictEqual(result.message, 'Transcrição removida com sucesso')
    assert.strictEqual(await transcriptionsRepository.getTranscriptionByVideoId('video-001'), undefined)
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

  it('deve lançar EntityNotFound quando o vídeo não possui transcrição', async () => {
    await videoRepository.createVideo(createSeedVideo())

    await assert.rejects(
      useCase.execute({ videoId: 'video-001' }),
      (error) => {
        assert.ok(error instanceof EntityNotFound)
        assert.strictEqual(error.message, 'Transcrição não encontrada')
        return true
      },
    )
  })
})
