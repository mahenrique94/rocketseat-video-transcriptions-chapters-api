import type { IChaptersRepository } from '../infrastructure/storage/chapters-repository'
import type { IVideosRepository } from '../../videos/infrastructure/storage/videos-repository'
import type { UseCase } from '@shared/types/use-case'
import { Chapter } from '@features/chapters/domain/chapter'
import { CreateChapterDTO } from './dto/create-chapter.dto'
import { ReturnCreatedChapterDTO } from './dto/return-created-chapter.dto'
import { chaptersMastra } from '@features/chapters/infrastructure/ai/mastra'
import { EntityNotFound, EntityAlreadyExists } from '@shared/exceptions/index'

export class CreateChaptersUseCase implements UseCase<CreateChapterDTO, ReturnCreatedChapterDTO> {
  constructor(
    private readonly videoRepository: IVideosRepository,
    private readonly chaptersRepository: IChaptersRepository,
  ) {}

  async execute(input: CreateChapterDTO): Promise<ReturnCreatedChapterDTO> {
    const video = await this.videoRepository.getVideoById(input.videoId)
    if (!video) {
      throw new EntityNotFound('Vídeo não encontrado')
    }

    const existing = await this.chaptersRepository.getChaptersByVideoId(input.videoId)
    if (existing) {
      throw new EntityAlreadyExists('Vídeo já possui capítulos')
    }

    const agent = chaptersMastra.getAgentById('chapter-agent')
    const response = await agent.generate(
      `Gere capítulos para o vídeo do YouTube com ID: ${video.videoId}`,
    )

    const chapter = Chapter.create({ videoId: input.videoId, content: response.text })
    const created = await this.chaptersRepository.createChapters(chapter)

    return new ReturnCreatedChapterDTO(
      created.id,
      created.videoId,
      created.content,
      created.createdAt,
      created.updatedAt,
    )
  }
}
