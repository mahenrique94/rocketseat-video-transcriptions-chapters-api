import type { FastifyReply, FastifyRequest } from 'fastify'
import type { DeleteTranscriptionUseCase } from '../../../application/delete-transcription-use-case'
import { DeleteTranscriptionDTO } from '../../../application/dto/delete-transcription.dto'
import { EntityNotFound } from '@shared/exceptions/index'

export class DeleteTranscriptionHandler {
  constructor(
    private readonly deleteTranscriptionUseCase: DeleteTranscriptionUseCase,
  ) {}

  async execute(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const input = new DeleteTranscriptionDTO(id)
      const result = await this.deleteTranscriptionUseCase.execute(input)
      return reply.send(result)
    } catch (error) {
      if (error instanceof EntityNotFound) {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  }
}
