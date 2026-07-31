import type { Video } from '@features/videos/domain/video'

export interface IVideosRepository {
  createVideo(video: Video): Promise<Video>
  getVideos(): Promise<Video[]>
  getVideoById(id: string): Promise<Video | undefined>
}
