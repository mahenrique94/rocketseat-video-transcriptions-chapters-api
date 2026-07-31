import { eq } from 'drizzle-orm'
import type { DbClient } from '@shared/db/index'
import { videos } from './tables'
import { Video } from '@features/videos/domain/video'
import type { IVideosRepository } from './videos-repository.ts'

export class VideosPostgresRepository implements IVideosRepository {
  constructor(private db: DbClient) {}

  async createVideo(video: Video) {
    const [result] = await this.db
      .insert(videos)
      .values({
        id: video.id,
        createdAt: video.createdAt,
        createdBy: video.createdBy,
        updatedAt: video.updatedAt,
        videoUrl: video.videoUrl,
        videoId: video.videoId,
      })
      .returning()

    return Video.toEntity(result)
  }

  async getVideos() {
    const rows = await this.db
      .select()
      .from(videos)
      .orderBy(videos.createdAt)

    return rows.map((row) => Video.toEntity(row))
  }

  async getVideoById(id: string) {
    const [result] = await this.db
      .select()
      .from(videos)
      .where(eq(videos.id, id))
      .limit(1)

    if (!result) return undefined

    return Video.toEntity(result)
  }
}
