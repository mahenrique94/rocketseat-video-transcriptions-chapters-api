import type { IChaptersRepository } from '../infrastructure/storage/chapters-repository'
import type { IVideosRepository } from '../../videos/infrastructure/storage/videos-repository'
import type { UseCase } from '@shared/types/use-case'
import { DeleteChapterDTO } from './dto/delete-chapter.dto'
import { ReturnDeletedChapterDTO } from './dto/return-deleted-chapter.dto'
import { EntityNotFound } from '@shared/exceptions/index'

export class DeleteChaptersUseCase implements UseCase<DeleteChapterDTO, ReturnDeletedChapterDTO> {
  constructor(
    private readonly videoRepository: IVideosRepository,
    private readonly chaptersRepository: IChaptersRepository,
  ) {}

  async execute(input: DeleteChapterDTO): Promise<ReturnDeletedChapterDTO> {
    const video = await this.videoRepository.getVideoById(input.videoId)
    if (!video) {
      throw new EntityNotFound('Vídeo não encontrado')
    }

    const existing = await this.chaptersRepository.getChaptersByVideoId(input.videoId)
    if (!existing) {
      throw new EntityNotFound('Capítulos não encontrados')
    }

    await this.chaptersRepository.softDeleteChapters(input.videoId)

    return new ReturnDeletedChapterDTO('Capítulos removidos com sucesso')
  }
}
