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
import { videoRoutes } from '@features/videos/interfaces/http/routes'
import { transcriptionsRoutes } from '@features/transcriptions/interfaces/http/routes'
import { chaptersRoutes } from '@features/chapters/interfaces/http/routes'
import { usersRoutes } from '@features/users/interfaces/http/routes'
import { CreateChapterHandler } from '@features/chapters/interfaces/http/handlers/create-chapter-handler'
import { GetChapterByVideoIdHandler } from '@features/chapters/interfaces/http/handlers/get-chapter-by-video-id-handler'
import { DeleteChapterHandler } from '@features/chapters/interfaces/http/handlers/delete-chapter-handler'
import { CreateUserHandler } from '@features/users/interfaces/http/handlers/create-user-handler'
import { SignInHandler } from '@features/users/interfaces/http/handlers/sign-in-handler'
import { RefreshTokenHandler } from '@features/users/interfaces/http/handlers/refresh-token-handler'
import { SignOutHandler } from '@features/users/interfaces/http/handlers/sign-out-handler'
import { CreateChaptersUseCase } from '@features/chapters/application/create-chapters-use-case'
import { GetChaptersByVideoIdUseCase } from '@features/chapters/application/get-chapters-by-video-id-use-case'
import { DeleteChaptersUseCase } from '@features/chapters/application/delete-chapters-use-case'
import { CreateUserUseCase } from '@features/users/application/create-user-use-case'
import { SignInUseCase } from '@features/users/application/sign-in-use-case'
import { RefreshTokenUseCase } from '@features/users/application/refresh-token-use-case'
import { SignOutUseCase } from '@features/users/application/sign-out-use-case'
import { isDbError, getDbError } from '@shared/utils/db-errors'
import { JsonWebTokenProvider } from '@shared/auth/jsonwebtoken-provider'
import { RefreshTokenGenerator } from '@shared/auth/refresh-token-generator'
import { AuthGuard } from '@shared/auth/auth-guard'
import { RoleGuard } from '@shared/auth/role-guard'
import type { IJwtProvider } from '@shared/auth/jwt-provider'
import type { UserPayload } from '@shared/types/fastify'
import type { IVideosRepository } from '@features/videos/infrastructure/storage/videos-repository'
import type { ITranscriptionsRepository } from '@features/transcriptions/infrastructure/storage/transcriptions-repository'
import type { IChaptersRepository } from '@features/chapters/infrastructure/storage/chapters-repository'
import type { IUsersRepository } from '@features/users/infrastructure/storage/users-repository'
import type { IRefreshTokensRepository } from '@features/users/infrastructure/storage/refresh-tokens-repository'
import type { ISessionsRepository } from '@features/users/infrastructure/storage/sessions-repository'
import db from '@shared/db/index'
import { VideosPostgresRepository } from '@features/videos/infrastructure/storage/videos-postgres-repository'
import { TranscriptionsPostgresRepository } from '@features/transcriptions/infrastructure/storage/transcriptions-postgres-repository'
import { ChaptersPostgresRepository } from '@features/chapters/infrastructure/storage/chapters-postgres-repository'
import { UsersPostgresRepository } from '@features/users/infrastructure/storage/users-postgres-repository'
import { RefreshTokensPostgresRepository } from '@features/users/infrastructure/storage/refresh-tokens-postgres-repository'
import { SessionsPostgresRepository } from '@features/users/infrastructure/storage/sessions-postgres-repository'

export interface AppDependencies {
  videoRepository?: IVideosRepository
  transcriptionsRepository?: ITranscriptionsRepository
  chaptersRepository?: IChaptersRepository
  usersRepository?: IUsersRepository
  refreshTokensRepository?: IRefreshTokensRepository
  sessionsRepository?: ISessionsRepository
  jwtProvider?: IJwtProvider
}

export function buildApp(deps?: AppDependencies) {
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

  const jwtProvider = deps?.jwtProvider ?? new JsonWebTokenProvider(
    process.env.JWT_SECRET ?? 'rocketseat-fastify-dev-secret',
  )
  const sessionsRepository = deps?.sessionsRepository ?? new SessionsPostgresRepository(db)
  const authGuard = new AuthGuard(jwtProvider, sessionsRepository)
  const roleGuard = new RoleGuard(['/api/v1/auth/sign-out'])

  app.addHook('preHandler', async (request, reply) => {
    const publicRoutes = [
      "/api/v1/auth/sign-in",
      "/api/v1/auth/sign-up",
      "/api/v1/auth/refresh-token",
      "/api/docs"
    ]
    
    if (publicRoutes.some(route => request.url.startsWith(route))) {
      return
    }

    await authGuard.execute(request, reply)
    if (reply.sent) {
      return
    }

    return roleGuard.execute(request, reply)
  })

  const videoRepository = deps?.videoRepository ?? new VideosPostgresRepository(db)
  const transcriptionsRepository = deps?.transcriptionsRepository ?? new TranscriptionsPostgresRepository(db)
  const chaptersRepository = deps?.chaptersRepository ?? new ChaptersPostgresRepository(db)
  const usersRepository = deps?.usersRepository ?? new UsersPostgresRepository(db)
  const refreshTokensRepository = deps?.refreshTokensRepository ?? new RefreshTokensPostgresRepository(db)

  const accessTokenExpiresIn = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? '15m'
  const refreshTokenExpiresInDays = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? '30')
  const refreshTokenGenerator = new RefreshTokenGenerator()

  const createChaptersUseCase = new CreateChaptersUseCase(videoRepository, chaptersRepository)
  const getChaptersByVideoIdUseCase = new GetChaptersByVideoIdUseCase(videoRepository, chaptersRepository)
  const deleteChaptersUseCase = new DeleteChaptersUseCase(videoRepository, chaptersRepository)
  const createChapterHandler = new CreateChapterHandler(createChaptersUseCase)
  const getChapterByVideoIdHandler = new GetChapterByVideoIdHandler(getChaptersByVideoIdUseCase)
  const deleteChapterHandler = new DeleteChapterHandler(deleteChaptersUseCase)
  const createUserUseCase = new CreateUserUseCase(usersRepository)
  const createUserHandler = new CreateUserHandler(createUserUseCase)
  const signInUseCase = new SignInUseCase(
    usersRepository,
    jwtProvider,
    refreshTokensRepository,
    refreshTokenGenerator,
    sessionsRepository,
    accessTokenExpiresIn,
    refreshTokenExpiresInDays,
  )
  const signInHandler = new SignInHandler(signInUseCase)
  const refreshTokenUseCase = new RefreshTokenUseCase(
    usersRepository,
    refreshTokensRepository,
    jwtProvider,
    refreshTokenGenerator,
    sessionsRepository,
    accessTokenExpiresIn,
    refreshTokenExpiresInDays,
  )
  const refreshTokenHandler = new RefreshTokenHandler(refreshTokenUseCase)
  const signOutUseCase = new SignOutUseCase(sessionsRepository, refreshTokensRepository)
  const signOutHandler = new SignOutHandler(signOutUseCase)

  app.register(videoRoutes, { videoRepository })
  app.register(transcriptionsRoutes, { videoRepository, transcriptionsRepository })
  app.register(chaptersRoutes, { createChapterHandler, getChapterByVideoIdHandler, deleteChapterHandler })
  app.register(usersRoutes, { createUserHandler, signInHandler, refreshTokenHandler, signOutHandler })

  return app
}
