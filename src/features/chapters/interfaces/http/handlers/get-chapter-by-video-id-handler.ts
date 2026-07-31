import type { FastifyReply, FastifyRequest } from 'fastify'
import type { GetChaptersByVideoIdUseCase } from '../../../application/get-chapters-by-video-id-use-case'
import { GetChapterByVideoIdDTO } from '../../../application/dto/get-chapter-by-video-id.dto'
import { EntityNotFound } from '@shared/exceptions/index'

export class GetChapterByVideoIdHandler {
  constructor(
    private readonly getChaptersByVideoIdUseCase: GetChaptersByVideoIdUseCase,
  ) {}

  async execute(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const input = new GetChapterByVideoIdDTO(id)
      const chapters = await this.getChaptersByVideoIdUseCase.execute(input)
      return reply.send({ chapters })
    } catch (error) {
      if (error instanceof EntityNotFound) {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  }
}
