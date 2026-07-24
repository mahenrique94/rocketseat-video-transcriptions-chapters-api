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
import { transcriptionRoutes } from './routes/transcriptions.ts'
import type { UserPayload } from './types/fastify.ts'

const app = fastify()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Rocketseat Fastify API',
      description: 'API de transcrições de vídeos do YouTube',
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
app.register(transcriptionRoutes)

app.listen({ port: 3333 }).then(() => {
  console.log('Server running on http://localhost:3333')
})
