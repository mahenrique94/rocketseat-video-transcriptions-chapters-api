import { nanoid } from 'nanoid'
import db from './index.ts'
import { transcriptions } from './schema.ts'

export type Transcription = typeof transcriptions.$inferSelect

export async function createTranscription(
  youtubeUrl: string,
  youtubeId: string,
  userId: string,
): Promise<Transcription> {
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
    })
    .returning()

  return result!
}

export async function getTranscriptions(): Promise<Transcription[]> {
  return db
    .select()
    .from(transcriptions)
    .orderBy(transcriptions.createdAt)
}
