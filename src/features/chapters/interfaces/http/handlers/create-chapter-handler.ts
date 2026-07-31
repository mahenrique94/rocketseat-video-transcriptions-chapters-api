import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateChaptersUseCase } from '../../../application/create-chapters-use-case'
import { CreateChapterDTO } from '../../../application/dto/create-chapter.dto'
import { EntityNotFound, EntityAlreadyExists } from '@shared/exceptions/index'

export class CreateChapterHandler {
  constructor(
    private readonly createChaptersUseCase: CreateChaptersUseCase,
  ) {}

  async execute(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const input = new CreateChapterDTO(id)
      const chapters = await this.createChaptersUseCase.execute(input)
      return reply.status(201).send({ chapters })
    } catch (error) {
      if (error instanceof EntityNotFound) {
        return reply.status(404).send({ message: error.message })
      }
      if (error instanceof EntityAlreadyExists) {
        return reply.status(409).send({ message: error.message })
      }
      throw error
    }
  }
}
