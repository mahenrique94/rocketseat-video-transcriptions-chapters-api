import type { IVideosRepository } from '../infrastructure/storage/videos-repository'
import type { UseCase } from '@shared/types/use-case'
import { EntityNotFound } from '@shared/exceptions/index'
import { GetVideoByIdDTO } from './dto/get-video-by-id.dto'
import { ReturnVideoDTO } from './dto/return-video.dto'

export class GetVideoByIdUseCase implements UseCase<GetVideoByIdDTO, ReturnVideoDTO> {
  constructor(private readonly videoRepository: IVideosRepository) {}

  async execute(input: GetVideoByIdDTO): Promise<ReturnVideoDTO> {
    const video = await this.videoRepository.getVideoById(input.id)
    if (!video) {
      throw new EntityNotFound('Vídeo não encontrado')
    }

    return new ReturnVideoDTO(
      video.id,
      video.videoUrl,
      video.videoId,
      video.createdAt,
      video.updatedAt,
      video.createdBy,
    )
  }
}
