import type { IVideosRepository } from '../../videos/infrastructure/storage/videos-repository'
import type { ITranscriptionsRepository } from '../infrastructure/storage/transcriptions-repository'
import type { UseCase } from '@shared/types/use-case'
import { Transcription } from '@features/transcriptions/domain/transcription'
import { CreateTranscriptionDTO } from './dto/create-transcription.dto'
import { ReturnCreatedTranscriptionDTO } from './dto/return-created-transcription.dto'
import { transcriptionsMastra } from '@features/transcriptions/infrastructure/ai/mastra'
import { EntityNotFound, EntityAlreadyExists } from '@shared/exceptions/index'

export class CreateTranscriptionUseCase
  implements UseCase<CreateTranscriptionDTO, ReturnCreatedTranscriptionDTO>
{
  constructor(
    private readonly videoRepository: IVideosRepository,
    private readonly transcriptionsRepository: ITranscriptionsRepository,
  ) {}

  async execute(input: CreateTranscriptionDTO): Promise<ReturnCreatedTranscriptionDTO> {
    const video = await this.videoRepository.getVideoById(input.videoId)
    if (!video) {
      throw new EntityNotFound('Vídeo não encontrado')
    }

    const existing = await this.transcriptionsRepository.getTranscriptionByVideoId(input.videoId)
    if (existing) {
      throw new EntityAlreadyExists('Vídeo já possui uma transcrição')
    }

    const agent = transcriptionsMastra.getAgentById('transcription-agent')
    const response = await agent.generate(
      `Transcreva o vídeo do YouTube com ID: ${video.videoId}`,
    )

    const transcription = Transcription.create({ videoId: input.videoId, content: response.text })
    const created = await this.transcriptionsRepository.createTranscription(transcription)

    return new ReturnCreatedTranscriptionDTO(
      created.id,
      created.videoId,
      created.content,
      created.createdAt,
      created.updatedAt,
    )
  }
}
