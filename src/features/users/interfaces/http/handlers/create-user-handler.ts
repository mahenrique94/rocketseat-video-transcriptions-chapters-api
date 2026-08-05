import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateUserUseCase } from '../../../application/create-user-use-case'
import { CreateUserDTO } from '../../../application/dto/create-user.dto'
import { EntityAlreadyExists } from '@shared/exceptions/index'

export class CreateUserHandler {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
  ) {}

  async execute(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { firstName, lastName, email, password } = request.body as {
        firstName: string
        lastName: string
        email: string
        password: string
      }
      const input = new CreateUserDTO(firstName, lastName, email, password)
      const user = await this.createUserUseCase.execute(input)
      return reply.status(201).send(user)
    } catch (error) {
      if (error instanceof EntityAlreadyExists) {
        return reply.status(409).send({ message: error.message })
      }
      throw error
    }
  }
}
