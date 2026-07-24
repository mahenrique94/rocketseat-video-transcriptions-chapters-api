import 'fastify'

export interface UserPayload {
  id: string
  name: string
  email: string
}

declare module 'fastify' {
  interface FastifyRequest {
    user: UserPayload
  }
}
