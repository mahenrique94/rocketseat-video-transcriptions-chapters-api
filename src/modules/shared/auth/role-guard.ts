import type { FastifyReply, FastifyRequest } from 'fastify'

const readMethods = new Set(['GET', 'HEAD', 'OPTIONS'])

export class RoleGuard {
  constructor(private readonly exemptedRoutes: string[] = []) {}

  async execute(request: FastifyRequest, reply: FastifyReply) {
    if (this.exemptedRoutes.some((route) => request.url.startsWith(route))) {
      return
    }

    const method = request.method.toUpperCase()

    if (readMethods.has(method)) {
      return
    }

    if (request.user.role !== 'admin') {
      return reply.status(404).send({ message: 'Not found' })
    }
  }
}
