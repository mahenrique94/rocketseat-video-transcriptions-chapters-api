import { Transcription } from '@features/transcriptions/domain/transcription'
import type { ITranscriptionsRepository } from './transcriptions-repository.ts'

export class TranscriptionsInMemoryRepository implements ITranscriptionsRepository {
  private transcriptions: Transcription[] = []

  async getTranscriptionByVideoId(videoId: string): Promise<Transcription | undefined> {
    return this.transcriptions.find((transcription) => {
      return transcription.videoId === videoId && transcription.deletedAt === null
    })
  }

  async createTranscription(transcription: Transcription): Promise<Transcription> {
    this.transcriptions.push(transcription)
    return transcription
  }

  async softDeleteTranscription(videoId: string): Promise<void> {
    const found = this.transcriptions.find((transcription) => {
      return transcription.videoId === videoId && transcription.deletedAt === null
    })

    if (found) {
      const index = this.transcriptions.indexOf(found)
      const now = new Date()
      this.transcriptions[index] = new Transcription(
        found.id,
        found.videoId,
        found.content,
        found.createdAt,
        now,
        now,
      )
    }
  }
}
