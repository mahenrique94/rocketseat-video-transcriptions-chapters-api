import type { FastifyReply, FastifyRequest } from 'fastify'
import type { GetVideosUseCase } from '../../../application/get-videos-use-case'

export class GetVideosHandler {
  constructor(
    private readonly getVideosUseCase: GetVideosUseCase,
  ) {}

  async execute(_request: FastifyRequest, reply: FastifyReply) {
    const videos = await this.getVideosUseCase.execute()
    return reply.send(videos)
  }
}
