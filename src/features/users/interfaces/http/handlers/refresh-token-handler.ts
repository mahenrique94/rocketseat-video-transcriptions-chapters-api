import type { FastifyReply, FastifyRequest } from 'fastify'
import type { RefreshTokenUseCase } from '../../../application/refresh-token-use-case'
import { RefreshTokenDTO } from '../../../application/dto/refresh-token.dto'
import { InvalidRefreshToken } from '@shared/exceptions/index'

export class RefreshTokenHandler {
  constructor(private readonly refreshTokenUseCase: RefreshTokenUseCase) {}

  async execute(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { refreshToken } = request.body as { refreshToken: string }
      const input = new RefreshTokenDTO(refreshToken)
      const result = await this.refreshTokenUseCase.execute(input)
      return reply.status(200).send(result)
    } catch (error) {
      if (error instanceof InvalidRefreshToken) {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  }
}
