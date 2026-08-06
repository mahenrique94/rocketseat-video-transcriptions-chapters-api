import type { FastifyReply, FastifyRequest } from 'fastify'
import type { ConfirmAccountUseCase } from '../../../application/confirm-account-use-case'
import { ConfirmAccountDTO } from '../../../application/dto/confirm-account.dto'
import { InvalidConfirmationToken } from '@shared/exceptions/index'

export class ConfirmAccountHandler {
  constructor(private readonly confirmAccountUseCase: ConfirmAccountUseCase) {}

  async execute(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { token } = request.body as { token: string }
      await this.confirmAccountUseCase.execute(new ConfirmAccountDTO(token))
      return reply.status(200).send({ message: 'Conta confirmada com sucesso' })
    } catch (error) {
      if (error instanceof InvalidConfirmationToken) {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  }
}
