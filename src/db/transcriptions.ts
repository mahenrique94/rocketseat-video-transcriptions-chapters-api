import { nanoid } from 'nanoid'
import db from './index.ts'
import { transcriptions } from './schema.ts'

export type TranscriptionV1 = Omit<typeof transcriptions.$inferSelect, "videoUrl" | "videoId">
export type TranscriptionV2 = Omit<typeof transcriptions.$inferSelect, "youtubeUrl" | "youtubeId">

export async function createTranscription(
  youtubeUrl: string,
  youtubeId: string,
  videoUrl: string,
  videoId: string,
  userId: string,
): Promise<TranscriptionV1> {
  const now = new Date()
  const id = nanoid()

  const [result] = await db
    .insert(transcriptions)
    .values({
      id,
      createdAt: now,
      createdBy: userId,
      updatedAt: now,
      content: 'Fake transcription content',
      youtubeUrl,
      youtubeId,
      videoUrl,
      videoId,
    })
    .returning()

  return result!
}

export async function getTranscriptions(): Promise<TranscriptionV1[]> {
  return db
    .select({
      id: transcriptions.id,
      youtubeUrl: transcriptions.youtubeUrl,
      youtubeId: transcriptions.youtubeId,
      content: transcriptions.content,
      createdAt: transcriptions.createdAt,
      updatedAt: transcriptions.updatedAt,
      createdBy: transcriptions.createdBy,
    })
    .from(transcriptions)
    .orderBy(transcriptions.createdAt)
}

export async function getTranscriptionsV2(): Promise<TranscriptionV2[]> {
  return db
    .select({
      id: transcriptions.id,
      videoUrl: transcriptions.videoUrl,
      videoId: transcriptions.videoId,
      content: transcriptions.content,
      createdAt: transcriptions.createdAt,
      updatedAt: transcriptions.updatedAt,
      createdBy: transcriptions.createdBy,
    })
    .from(transcriptions)
    .orderBy(transcriptions.createdAt)
}
