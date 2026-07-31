import { and, eq, isNull } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import db from './index.ts'
import { videoChapters } from './schema.ts'

export type Chapter = typeof videoChapters.$inferSelect

export async function getChaptersByVideoId(
  videoId: string,
): Promise<Chapter | undefined> {
  const [result] = await db
    .select()
    .from(videoChapters)
    .where(
      and(
        eq(videoChapters.videoId, videoId),
        isNull(videoChapters.deletedAt),
      ),
    )
    .limit(1)

  return result
}

export async function createChapters(
  videoId: string,
  content: string,
): Promise<Chapter> {
  const now = new Date()
  const id = nanoid()

  const [result] = await db
    .insert(videoChapters)
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

export async function softDeleteChapters(videoId: string): Promise<void> {
  const now = new Date()

  await db
    .update(videoChapters)
    .set({ deletedAt: now, updatedAt: now })
    .where(and(eq(videoChapters.videoId, videoId), isNull(videoChapters.deletedAt)))
}
