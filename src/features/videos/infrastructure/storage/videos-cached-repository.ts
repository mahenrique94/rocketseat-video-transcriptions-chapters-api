import type { RedisClient } from '@shared/redis/index'
import { Video } from '@features/videos/domain/video'
import type { IVideosRepository } from './videos-repository.ts'

const VIDEO_CACHE_TTL_SECONDS = 60 * 60 * 24

const videoCacheKey = (id: string) => `video:${id}`

export class VideosCachedRepository implements IVideosRepository {
  constructor(
    private readonly delegate: IVideosRepository,
    private readonly redis: RedisClient,
  ) {}

  async createVideo(video: Video): Promise<Video> {
    return this.delegate.createVideo(video)
  }

  async getVideos(): Promise<Video[]> {
    return this.delegate.getVideos()
  }

  async getVideoById(id: string): Promise<Video | undefined> {
    const cached = await this.redis.get(videoCacheKey(id))

    if (cached) {
      return Video.toEntity(this.deserialize(cached))
    }

    const video = await this.delegate.getVideoById(id)

    if (video) {
      await this.redis.set(
        videoCacheKey(id),
        JSON.stringify(this.serialize(video)),
        'EX',
        VIDEO_CACHE_TTL_SECONDS,
      )
    }

    return video
  }

  private serialize(video: Video) {
    return {
      id: video.id,
      videoUrl: video.videoUrl,
      videoId: video.videoId,
      createdAt: video.createdAt.toISOString(),
      updatedAt: video.updatedAt.toISOString(),
      createdBy: video.createdBy,
    }
  }

  private deserialize(raw: string) {
    const data = JSON.parse(raw) as {
      id: string
      videoUrl: string
      videoId: string
      createdAt: string
      updatedAt: string
      createdBy: string
    }

    return {
      id: data.id,
      videoUrl: data.videoUrl,
      videoId: data.videoId,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      createdBy: data.createdBy,
    }
  }
}
