import { and, eq, isNull } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import db from './index.ts'
import { videoTranscriptions } from './schema.ts'

export type Transcription = typeof videoTranscriptions.$inferSelect

export async function getTranscriptionByVideoId(
  videoId: string,
): Promise<Transcription | undefined> {
  const [result] = await db
    .select()
    .from(videoTranscriptions)
    .where(
      and(
        eq(videoTranscriptions.videoId, videoId),
        isNull(videoTranscriptions.deletedAt),
      ),
    )
    .limit(1)

  return result
}

export async function createTranscription(
  videoId: string,
  content: string,
): Promise<Transcription> {
  const now = new Date()
  const id = nanoid()

  const [result] = await db
    .insert(videoTranscriptions)
    .values({
      id,
      videoId,
      content,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return result!
}

export async function softDeleteTranscription(videoId: string): Promise<void> {
  const now = new Date()

  await db
    .update(videoTranscriptions)
    .set({ deletedAt: now, updatedAt: now })
    .where(and(eq(videoTranscriptions.videoId, videoId), isNull(videoTranscriptions.deletedAt)))
}
