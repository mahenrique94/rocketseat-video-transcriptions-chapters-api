import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from '@fastify/type-provider-zod'
import type { CreateUserHandler } from './handlers/create-user-handler'
import type { SignInHandler } from './handlers/sign-in-handler'
import type { RefreshTokenHandler } from './handlers/refresh-token-handler'
import type { SignOutHandler } from './handlers/sign-out-handler'
import {
  signUpSchema,
  signInSchema,
  refreshTokenSchema,
  userResponseSchema,
  signInResponseSchema,
  refreshTokenResponseSchema,
  signOutResponseSchema,
} from './schemas.ts'
import { errorResponseSchema } from '@features/videos/interfaces/http/schemas'

export async function usersRoutes(
  app: FastifyInstance,
  opts: {
    createUserHandler: CreateUserHandler
    signInHandler: SignInHandler
    refreshTokenHandler: RefreshTokenHandler
    signOutHandler: SignOutHandler
  },
) {
  const { createUserHandler, signInHandler, refreshTokenHandler, signOutHandler } = opts

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/v1/auth/sign-up',
    schema: {
      body: signUpSchema,
      response: {
        201: userResponseSchema,
        400: errorResponseSchema,
        409: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: (request, reply) => createUserHandler.execute(request, reply),
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/v1/auth/sign-in',
    schema: {
      body: signInSchema,
      response: {
        200: signInResponseSchema,
        400: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: (request, reply) => signInHandler.execute(request, reply),
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/v1/auth/refresh-token',
    schema: {
      body: refreshTokenSchema,
      response: {
        200: refreshTokenResponseSchema,
        400: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: (request, reply) => refreshTokenHandler.execute(request, reply),
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/v1/auth/sign-out',
    schema: {
      response: {
        200: signOutResponseSchema,
        401: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: (request, reply) => signOutHandler.execute(request, reply),
  })
}
