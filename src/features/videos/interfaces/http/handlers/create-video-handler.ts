import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateVideoUseCase } from '../../../application/create-video-use-case'
import { CreateVideoDTO } from '../../../application/dto/create-video.dto'

export class CreateVideoHandler {
  constructor(
    private readonly createVideoUseCase: CreateVideoUseCase,
  ) {}

  async execute(request: FastifyRequest, reply: FastifyReply) {
    const { url } = request.body as { url: string }
    const input = new CreateVideoDTO(url, request.user.id)
    const video = await this.createVideoUseCase.execute(input)
    return reply.status(201).send(video)
  }
}
