import fastify from 'fastify'
import fastifySwagger from '@fastify/swagger'
import ScalarApiReference from '@scalar/fastify-api-reference'
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  jsonSchemaTransformObject,
  hasZodFastifySchemaValidationErrors,
} from '@fastify/type-provider-zod'
import { videoRoutes } from './routes/videos.ts'
import { isDbError, getDbError } from './utils/db-errors.ts'
import type { UserPayload } from './types/fastify.ts'

export function buildApp() {
  const app = fastify()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Rocketseat Fastify API',
        description: 'API de vídeos',
        version: '1.0.0',
      },
    },
    transform: jsonSchemaTransform,
    transformObject: jsonSchemaTransformObject,
  })

  app.register(ScalarApiReference, {
    routePrefix: '/api/docs',
  })

  app.setErrorHandler((error, _, reply) => {
    console.error(error)

    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        message: 'Validation error',
        errors: error.validation,
      })
    }

    if (isDbError(error)) {
      const dbError = getDbError(error)
      return reply.status(dbError.status).send({
        message: dbError.message,
        detail: dbError.detail,
      })
    }

    return reply.status(500).send({ message: (error as Error).message })
  })

  app.decorateRequest<UserPayload>('user', undefined as unknown as UserPayload)
  app.addHook('preHandler', async (request) => {
    request.user = {
      id: 'user-001',
      name: 'Mock User',
      email: 'mock@example.com',
    }
  })
  app.register(videoRoutes)

  return app
}
