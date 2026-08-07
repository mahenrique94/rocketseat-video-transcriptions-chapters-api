import type { IVideosRepository } from '../infrastructure/storage/videos-repository'
import type { UseCase } from '@shared/types/use-case'
import { ReturnVideoDTO } from './dto/return-video.dto'

export class GetVideosUseCase implements UseCase<void, ReturnVideoDTO[]> {
  constructor(private readonly videoRepository: IVideosRepository) {}

  async execute(_input: void): Promise<ReturnVideoDTO[]> {
    const videos = await this.videoRepository.getVideos()

    return videos.map(
      (video) =>
        new ReturnVideoDTO(
          video.id,
          video.videoUrl,
          video.videoId,
          video.createdAt,
          video.updatedAt,
          video.createdBy,
        ),
    )
  }
}
