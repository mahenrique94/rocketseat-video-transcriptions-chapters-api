import type { FastifyReply, FastifyRequest } from 'fastify'
import type { SignInUseCase } from '../../../application/sign-in-use-case'
import { SignInDTO } from '../../../application/dto/sign-in.dto'
import { InvalidCredentials } from '@shared/exceptions/index'

export class SignInHandler {
  constructor(private readonly signInUseCase: SignInUseCase) {}

  async execute(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { email, password } = request.body as {
        email: string
        password: string
      }
      const input = new SignInDTO(email, password)
      const result = await this.signInUseCase.execute(input)
      return reply.status(200).send(result)
    } catch (error) {
      if (error instanceof InvalidCredentials) {
        return reply.status(401).send({ message: error.message })
      }
      throw error
    }
  }
}
