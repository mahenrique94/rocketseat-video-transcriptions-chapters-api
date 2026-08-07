import type { IVideosRepository } from '../../videos/infrastructure/storage/videos-repository'
import type { ITranscriptionsRepository } from '../infrastructure/storage/transcriptions-repository'
import type { UseCase } from '@shared/types/use-case'
import { DeleteTranscriptionDTO } from './dto/delete-transcription.dto'
import { ReturnDeletedTranscriptionDTO } from './dto/return-deleted-transcription.dto'
import { EntityNotFound } from '@shared/exceptions/index'

export class DeleteTranscriptionUseCase
  implements UseCase<DeleteTranscriptionDTO, ReturnDeletedTranscriptionDTO>
{
  constructor(
    private readonly videoRepository: IVideosRepository,
    private readonly transcriptionsRepository: ITranscriptionsRepository,
  ) {}

  async execute(input: DeleteTranscriptionDTO): Promise<ReturnDeletedTranscriptionDTO> {
    const video = await this.videoRepository.getVideoById(input.videoId)
    if (!video) {
      throw new EntityNotFound('Vídeo não encontrado')
    }

    const existing = await this.transcriptionsRepository.getTranscriptionByVideoId(input.videoId)
    if (!existing) {
      throw new EntityNotFound('Transcrição não encontrada')
    }

    await this.transcriptionsRepository.softDeleteTranscription(input.videoId)

    return new ReturnDeletedTranscriptionDTO('Transcrição removida com sucesso')
  }
}
