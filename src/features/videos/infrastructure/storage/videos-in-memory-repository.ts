import type { Video } from '@features/videos/domain/video'
import type { IVideosRepository } from './videos-repository.ts'

export class VideosInMemoryRepository implements IVideosRepository {
  private videos: Video[] = []

  async createVideo(video: Video): Promise<Video> {
    this.videos.push(video)
    return video
  }

  async getVideos(): Promise<Video[]> {
    return [...this.videos].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  async getVideoById(id: string): Promise<Video | undefined> {
    return this.videos.find((video) => video.id === id)
  }
}
