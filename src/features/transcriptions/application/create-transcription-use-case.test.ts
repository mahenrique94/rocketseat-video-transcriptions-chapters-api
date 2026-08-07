import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { EntityNotFound, EntityAlreadyExists } from '@shared/exceptions/index'

mock.module('@features/transcriptions/infrastructure/ai/mastra', {
  exports: {
    transcriptionsMastra: {
      getAgentById: () => ({
        generate: async () => ({ text: 'transcrição fictícia do vídeo' }),
      }),
    },
  },
})

const { CreateTranscriptionUseCase } = await import('./create-transcription-use-case.ts')
const { VideosInMemoryRepository } = await import('../../videos/infrastructure/storage/videos-in-memory-repository.ts')
const { TranscriptionsInMemoryRepository } = await import('../infrastructure/storage/transcriptions-in-memory-repository.ts')
const { Video } = await import('../../videos/domain/video.ts')
const { Transcription } = await import('../domain/transcription.ts')

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

describe('CreateTranscriptionUseCase', () => {
  let videoRepository: InstanceType<typeof VideosInMemoryRepository>
  let transcriptionsRepository: InstanceType<typeof TranscriptionsInMemoryRepository>
  let useCase: InstanceType<typeof CreateTranscriptionUseCase>

  beforeEach(() => {
    videoRepository = new VideosInMemoryRepository()
    transcriptionsRepository = new TranscriptionsInMemoryRepository()
    useCase = new CreateTranscriptionUseCase(videoRepository, transcriptionsRepository)
  })

  it('deve gerar e persistir a transcrição para um vídeo existente', async () => {
    await videoRepository.createVideo(createSeedVideo())

    const result = await useCase.execute({ videoId: 'video-001' })

    assert.strictEqual(result.videoId, 'video-001')
    assert.strictEqual(result.content, 'transcrição fictícia do vídeo')
    assert.ok(result.id)
    assert.ok(result.createdAt instanceof Date)
    assert.ok(result.updatedAt instanceof Date)

    const persisted = await transcriptionsRepository.getTranscriptionByVideoId('video-001')
    assert.ok(persisted)
    assert.strictEqual(persisted.content, 'transcrição fictícia do vídeo')
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

  it('deve lançar EntityAlreadyExists quando o vídeo já possui transcrição', async () => {
    await videoRepository.createVideo(createSeedVideo())
    await transcriptionsRepository.createTranscription(createSeedTranscription('video-001'))

    await assert.rejects(
      useCase.execute({ videoId: 'video-001' }),
      (error) => {
        assert.ok(error instanceof EntityAlreadyExists)
        assert.strictEqual(error.message, 'Vídeo já possui uma transcrição')
        return true
      },
    )
  })
})
