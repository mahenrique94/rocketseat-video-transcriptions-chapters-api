import type { IVideosRepository } from '../infrastructure/storage/videos-repository'
import type { UseCase } from '@shared/types/use-case'
import type { IVideoProcessingQueue } from '../infrastructure/queue/video-processing-queue'
import { Video } from '@features/videos/domain/video'
import { extractVideoId } from '@features/videos/domain/services/extract-video-id'
import { CreateVideoDTO } from './dto/create-video.dto'
import { ReturnCreatedVideoDTO } from './dto/return-created-video.dto'

export class CreateVideoUseCase implements UseCase<CreateVideoDTO, ReturnCreatedVideoDTO> {
  constructor(
    private readonly videoRepository: IVideosRepository,
    private readonly videoProcessingQueue: IVideoProcessingQueue,
  ) {}

  async execute(input: CreateVideoDTO): Promise<ReturnCreatedVideoDTO> {
    const videoId = extractVideoId(input.url)
    const video = Video.create({ videoUrl: input.url, videoId, createdBy: input.createdBy })
    const created = await this.videoRepository.createVideo(video)

    await this.videoProcessingQueue.addTranscriptionJob(created.id)
    await this.videoProcessingQueue.addChaptersJob(created.id)

    return new ReturnCreatedVideoDTO(
      created.id,
      created.videoUrl,
      created.videoId,
      created.createdAt,
      created.updatedAt,
      created.createdBy,
    )
  }
}
