import type { FastifyReply, FastifyRequest } from 'fastify'
import type { SignOutUseCase } from '../../../application/sign-out-use-case'
import { SignOutDTO } from '../../../application/dto/sign-out.dto'

export class SignOutHandler {
  constructor(private readonly signOutUseCase: SignOutUseCase) {}

  async execute(request: FastifyRequest, reply: FastifyReply) {
    await this.signOutUseCase.execute(new SignOutDTO(request.user.id, request.user.jti))
    return reply.status(200).send({ message: 'Sessão encerrada com sucesso' })
  }
}
