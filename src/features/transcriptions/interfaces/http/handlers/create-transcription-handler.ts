import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateTranscriptionUseCase } from '../../../application/create-transcription-use-case'
import { CreateTranscriptionDTO } from '../../../application/dto/create-transcription.dto'
import { EntityNotFound, EntityAlreadyExists } from '@shared/exceptions/index'

export class CreateTranscriptionHandler {
  constructor(
    private readonly createTranscriptionUseCase: CreateTranscriptionUseCase,
  ) {}

  async execute(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const input = new CreateTranscriptionDTO(id)
      const transcription = await this.createTranscriptionUseCase.execute(input)
      return reply.status(201).send({ transcription })
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
