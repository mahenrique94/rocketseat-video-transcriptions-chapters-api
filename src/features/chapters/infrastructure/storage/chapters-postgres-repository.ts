import { and, eq, isNull } from 'drizzle-orm'
import type { DbClient } from '@shared/db/index'
import { videoChapters } from './tables'
import { Chapter } from '@features/chapters/domain/chapter'
import type { IChaptersRepository } from './chapters-repository.ts'

export class ChaptersPostgresRepository implements IChaptersRepository {
  constructor(private db: DbClient) {}

  async getChaptersByVideoId(videoId: string) {
    const [result] = await this.db
      .select()
      .from(videoChapters)
      .where(
        and(
          eq(videoChapters.videoId, videoId),
          isNull(videoChapters.deletedAt),
        ),
      )
      .limit(1)

    if (!result) return undefined

    return Chapter.toEntity(result)
  }

  async createChapters(chapter: Chapter) {
    const [result] = await this.db
      .insert(videoChapters)
      .values({
        id: chapter.id,
        videoId: chapter.videoId,
        content: chapter.content,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
      })
      .returning()

    return Chapter.toEntity(result)
  }

  async softDeleteChapters(videoId: string) {
    const now = new Date()

    await this.db
      .update(videoChapters)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(videoChapters.videoId, videoId), isNull(videoChapters.deletedAt)))
  }
}
