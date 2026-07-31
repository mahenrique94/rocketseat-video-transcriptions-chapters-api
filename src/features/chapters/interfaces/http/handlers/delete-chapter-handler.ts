import type { FastifyReply, FastifyRequest } from 'fastify'
import type { DeleteChaptersUseCase } from '../../../application/delete-chapters-use-case'
import { DeleteChapterDTO } from '../../../application/dto/delete-chapter.dto'
import { EntityNotFound } from '@shared/exceptions/index'

export class DeleteChapterHandler {
  constructor(
    private readonly deleteChaptersUseCase: DeleteChaptersUseCase,
  ) {}

  async execute(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const input = new DeleteChapterDTO(id)
      const result = await this.deleteChaptersUseCase.execute(input)
      return reply.send(result)
    } catch (error) {
      if (error instanceof EntityNotFound) {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  }
}
