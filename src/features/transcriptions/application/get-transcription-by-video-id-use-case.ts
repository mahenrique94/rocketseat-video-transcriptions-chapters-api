import type { IVideosRepository } from '../../videos/infrastructure/storage/videos-repository'
import type { ITranscriptionsRepository } from '../infrastructure/storage/transcriptions-repository'
import type { UseCase } from '@shared/types/use-case'
import { GetTranscriptionByVideoIdDTO } from './dto/get-transcription-by-video-id.dto'
import { ReturnTranscriptionDTO } from './dto/return-transcription.dto'
import { EntityNotFound } from '@shared/exceptions/index'

export class GetTranscriptionByVideoIdUseCase
  implements UseCase<GetTranscriptionByVideoIdDTO, ReturnTranscriptionDTO>
{
  constructor(
    private readonly videoRepository: IVideosRepository,
    private readonly transcriptionsRepository: ITranscriptionsRepository,
  ) {}

  async execute(input: GetTranscriptionByVideoIdDTO): Promise<ReturnTranscriptionDTO> {
    const video = await this.videoRepository.getVideoById(input.videoId)
    if (!video) {
      throw new EntityNotFound('Vídeo não encontrado')
    }

    const transcription = await this.transcriptionsRepository.getTranscriptionByVideoId(input.videoId)
    if (!transcription) {
      throw new EntityNotFound('Transcrição não encontrada')
    }

    return new ReturnTranscriptionDTO(
      transcription.id,
      transcription.videoId,
      transcription.content,
      transcription.createdAt,
      transcription.updatedAt,
    )
  }
}
