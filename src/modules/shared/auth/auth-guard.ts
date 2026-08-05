import type { FastifyReply, FastifyRequest } from 'fastify'
import type { IJwtProvider, JwtPayload } from './jwt-provider'
import type { ISessionsRepository } from '@features/users/infrastructure/storage/sessions-repository'
import { Session } from '@features/users/domain/session'

export class AuthGuard {
  constructor(
    private readonly jwtProvider: IJwtProvider,
    private readonly sessionsRepository: ISessionsRepository,
  ) {}

  async execute(request: FastifyRequest, reply: FastifyReply) {
    const authorization = request.headers.authorization

    if (!authorization?.startsWith('Bearer ')) {
      return reply.status(401).send({ message: 'Token de autenticação não informado' })
    }

    const token = authorization.slice('Bearer '.length)

    try {
      const payload = this.jwtProvider.verify<JwtPayload>(token)

      const session = await this.sessionsRepository.findByJtiHash(Session.hashJti(payload.jti))

      if (!session || session.isRevoked() || session.isExpired() || session.userId !== payload.sub) {
        return reply.status(401).send({ message: 'Sessão inválida ou expirada' })
      }

      request.user = {
        id: payload.sub,
        email: payload.email,
        jti: payload.jti,
        role: payload.role,
      }
    } catch {
      return reply.status(401).send({ message: 'Token de autenticação inválido ou expirado' })
    }
  }
}
