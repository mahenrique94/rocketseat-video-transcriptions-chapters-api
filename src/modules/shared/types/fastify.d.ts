import 'fastify'
import type { UserRole } from '@features/users/domain/user'

export interface UserPayload {
  id: string
  email: string
  jti: string
  role: UserRole
}

declare module 'fastify' {
  interface FastifyRequest {
    user: UserPayload
  }
}
