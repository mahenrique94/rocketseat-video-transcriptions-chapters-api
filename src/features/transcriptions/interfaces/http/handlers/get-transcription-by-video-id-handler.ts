import type { FastifyReply, FastifyRequest } from 'fastify'
import type { GetTranscriptionByVideoIdUseCase } from '../../../application/get-transcription-by-video-id-use-case'
import { GetTranscriptionByVideoIdDTO } from '../../../application/dto/get-transcription-by-video-id.dto'
import { EntityNotFound } from '@shared/exceptions/index'

export class GetTranscriptionByVideoIdHandler {
  constructor(
    private readonly getTranscriptionByVideoIdUseCase: GetTranscriptionByVideoIdUseCase,
  ) {}

  async execute(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const input = new GetTranscriptionByVideoIdDTO(id)
      const transcription = await this.getTranscriptionByVideoIdUseCase.execute(input)
      return reply.send({ transcription })
    } catch (error) {
      if (error instanceof EntityNotFound) {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  }
}
