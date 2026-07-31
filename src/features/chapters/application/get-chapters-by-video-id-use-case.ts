import type { IChaptersRepository } from '../infrastructure/storage/chapters-repository'
import type { IVideosRepository } from '../../videos/infrastructure/storage/videos-repository'
import type { UseCase } from '@shared/types/use-case'
import { GetChapterByVideoIdDTO } from './dto/get-chapter-by-video-id.dto'
import { ReturnChapterDTO } from './dto/return-chapter.dto'
import { EntityNotFound } from '@shared/exceptions/index'

export class GetChaptersByVideoIdUseCase
  implements UseCase<GetChapterByVideoIdDTO, ReturnChapterDTO>
{
  constructor(
    private readonly videoRepository: IVideosRepository,
    private readonly chaptersRepository: IChaptersRepository,
  ) {}

  async execute(input: GetChapterByVideoIdDTO): Promise<ReturnChapterDTO> {
    const video = await this.videoRepository.getVideoById(input.videoId)
    if (!video) {
      throw new EntityNotFound('Vídeo não encontrado')
    }

    const chapters = await this.chaptersRepository.getChaptersByVideoId(input.videoId)
    if (!chapters) {
      throw new EntityNotFound('Capítulos não encontrados')
    }

    return new ReturnChapterDTO(
      chapters.id,
      chapters.videoId,
      chapters.content,
      chapters.createdAt,
      chapters.updatedAt,
    )
  }
}
