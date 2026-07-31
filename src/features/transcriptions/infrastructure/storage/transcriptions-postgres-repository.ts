import { and, eq, isNull } from 'drizzle-orm'
import type { DbClient } from '@shared/db/index'
import { videoTranscriptions } from './tables'
import { Transcription } from '@features/transcriptions/domain/transcription'
import type { ITranscriptionsRepository } from './transcriptions-repository.ts'

export class TranscriptionsPostgresRepository implements ITranscriptionsRepository {
  constructor(private db: DbClient) {}

  async getTranscriptionByVideoId(videoId: string) {
    const [result] = await this.db
      .select()
      .from(videoTranscriptions)
      .where(
        and(
          eq(videoTranscriptions.videoId, videoId),
          isNull(videoTranscriptions.deletedAt),
        ),
      )
      .limit(1)

    if (!result) return undefined

    return Transcription.toEntity(result)
  }

  async createTranscription(transcription: Transcription) {
    const [result] = await this.db
      .insert(videoTranscriptions)
      .values({
        id: transcription.id,
        videoId: transcription.videoId,
        content: transcription.content,
        createdAt: transcription.createdAt,
        updatedAt: transcription.updatedAt,
      })
      .returning()

    return Transcription.toEntity(result)
  }

  async softDeleteTranscription(videoId: string) {
    const now = new Date()

    await this.db
      .update(videoTranscriptions)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(videoTranscriptions.videoId, videoId), isNull(videoTranscriptions.deletedAt)))
  }
}
