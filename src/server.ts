import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  hasZodFastifySchemaValidationErrors,
} from '@fastify/type-provider-zod'
import { transcriptionRoutes } from './routes/transcriptions.ts'
import type { UserPayload } from './types/fastify.ts'

const app = fastify()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.setErrorHandler((error, _, reply) => {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({
      message: 'Validation error',
      errors: error.validation,
    })
  }

  return reply.status(500).send({ message: 'Internal server error' })
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
