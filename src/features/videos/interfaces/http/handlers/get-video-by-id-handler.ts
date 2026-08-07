import type { FastifyReply, FastifyRequest } from 'fastify'
import type { GetVideoByIdUseCase } from '../../../application/get-video-by-id-use-case'
import { GetVideoByIdDTO } from '../../../application/dto/get-video-by-id.dto'
import { EntityNotFound } from '@shared/exceptions/index'

export class GetVideoByIdHandler {
  constructor(
    private readonly getVideoByIdUseCase: GetVideoByIdUseCase,
  ) {}

  async execute(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const input = new GetVideoByIdDTO(id)
      const video = await this.getVideoByIdUseCase.execute(input)
      return reply.send(video)
    } catch (error) {
      if (error instanceof EntityNotFound) {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  }
}
