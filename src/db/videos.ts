import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import db from './index.ts'
import { videos } from './schema.ts'

export type Video = typeof videos.$inferSelect

export async function createVideo(
  videoUrl: string,
  videoId: string,
  userId: string,
): Promise<Video> {
  const now = new Date()
  const id = nanoid()

  const [result] = await db
    .insert(videos)
    .values({
      id,
      createdAt: now,
      createdBy: userId,
      updatedAt: now,
      videoUrl,
      videoId,
    })
    .returning()

  return result!
}

export async function getVideos(): Promise<Video[]> {
  return db
    .select()
    .from(videos)
    .orderBy(videos.createdAt)
}

export async function getVideoById(id: string): Promise<Video | undefined> {
  const [result] = await db
    .select()
    .from(videos)
    .where(eq(videos.id, id))
    .limit(1)

  return result
}
