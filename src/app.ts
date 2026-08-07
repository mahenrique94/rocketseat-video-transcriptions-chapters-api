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
import { CreateVideoHandler } from '@features/videos/interfaces/http/handlers/create-video-handler'
import { GetVideosHandler } from '@features/videos/interfaces/http/handlers/get-videos-handler'
import { GetVideoByIdHandler } from '@features/videos/interfaces/http/handlers/get-video-by-id-handler'
import { CreateTranscriptionHandler } from '@features/transcriptions/interfaces/http/handlers/create-transcription-handler'
import { GetTranscriptionByVideoIdHandler } from '@features/transcriptions/interfaces/http/handlers/get-transcription-by-video-id-handler'
import { DeleteTranscriptionHandler } from '@features/transcriptions/interfaces/http/handlers/delete-transcription-handler'
import { CreateChapterHandler } from '@features/chapters/interfaces/http/handlers/create-chapter-handler'
import { GetChapterByVideoIdHandler } from '@features/chapters/interfaces/http/handlers/get-chapter-by-video-id-handler'
import { DeleteChapterHandler } from '@features/chapters/interfaces/http/handlers/delete-chapter-handler'
import { CreateUserHandler } from '@features/users/interfaces/http/handlers/create-user-handler'
import { SignInHandler } from '@features/users/interfaces/http/handlers/sign-in-handler'
import { RefreshTokenHandler } from '@features/users/interfaces/http/handlers/refresh-token-handler'
import { SignOutHandler } from '@features/users/interfaces/http/handlers/sign-out-handler'
import { ConfirmAccountHandler } from '@features/users/interfaces/http/handlers/confirm-account-handler'
import { CreateChaptersUseCase } from '@features/chapters/application/create-chapters-use-case'
import { GetChaptersByVideoIdUseCase } from '@features/chapters/application/get-chapters-by-video-id-use-case'
import { DeleteChaptersUseCase } from '@features/chapters/application/delete-chapters-use-case'
import { CreateVideoUseCase } from '@features/videos/application/create-video-use-case'
import { GetVideosUseCase } from '@features/videos/application/get-videos-use-case'
import { GetVideoByIdUseCase } from '@features/videos/application/get-video-by-id-use-case'
import { CreateTranscriptionUseCase } from '@features/transcriptions/application/create-transcription-use-case'
import { GetTranscriptionByVideoIdUseCase } from '@features/transcriptions/application/get-transcription-by-video-id-use-case'
import { DeleteTranscriptionUseCase } from '@features/transcriptions/application/delete-transcription-use-case'
import { CreateUserUseCase } from '@features/users/application/create-user-use-case'
import { SignInUseCase } from '@features/users/application/sign-in-use-case'
import { RefreshTokenUseCase } from '@features/users/application/refresh-token-use-case'
import { SignOutUseCase } from '@features/users/application/sign-out-use-case'
import { ConfirmAccountUseCase } from '@features/users/application/confirm-account-use-case'
import { isDbError, getDbError } from '@shared/utils/db-errors'
import { JsonWebTokenProvider } from '@shared/auth/jsonwebtoken-provider'
import { RefreshTokenGenerator } from '@shared/auth/refresh-token-generator'
import { ConfirmationTokenGenerator } from '@shared/auth/confirmation-token-generator'
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
import { config } from '@shared/config/index'
import db from '@shared/db/index'
import { VideosPostgresRepository } from '@features/videos/infrastructure/storage/videos-postgres-repository'
import { VideosCachedRepository } from '@features/videos/infrastructure/storage/videos-cached-repository'
import { TranscriptionsPostgresRepository } from '@features/transcriptions/infrastructure/storage/transcriptions-postgres-repository'
import { ChaptersPostgresRepository } from '@features/chapters/infrastructure/storage/chapters-postgres-repository'
import { UsersPostgresRepository } from '@features/users/infrastructure/storage/users-postgres-repository'
import { RefreshTokensPostgresRepository } from '@features/users/infrastructure/storage/refresh-tokens-postgres-repository'
import { SessionsRedisRepository } from '@features/users/infrastructure/storage/sessions-redis-repository'
import type { IVideoProcessingQueue } from '@features/videos/infrastructure/queue/video-processing-queue'
import { BullMQVideoProcessingQueue } from '@features/videos/infrastructure/queue/bullmq-video-processing-queue'
import { InMemoryVideoProcessingQueue } from '@features/videos/infrastructure/queue/in-memory-video-processing-queue'
import { buildTranscriptionsWorker } from '@features/transcriptions/interfaces/workers'
import { buildChaptersWorker } from '@features/chapters/interfaces/workers'
import { getRedisConnectionOptions } from '@shared/queue/redis-connection'
import redis from '@shared/redis/index'

export interface AppDependencies {
  videoRepository?: IVideosRepository
  transcriptionsRepository?: ITranscriptionsRepository
  chaptersRepository?: IChaptersRepository
  usersRepository?: IUsersRepository
  refreshTokensRepository?: IRefreshTokensRepository
  sessionsRepository?: ISessionsRepository
  jwtProvider?: IJwtProvider
  videoProcessingQueue?: IVideoProcessingQueue
  enableVideoProcessingWorker?: boolean
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
    config.JWT_SECRET,
  )
  const usersRepository = deps?.usersRepository ?? new UsersPostgresRepository(db)
  const sessionsRepository = deps?.sessionsRepository ?? new SessionsRedisRepository(redis)
  const authGuard = new AuthGuard(jwtProvider, sessionsRepository, usersRepository)
  const roleGuard = new RoleGuard(['/api/v1/auth/sign-out'])

  app.addHook('preHandler', async (request, reply) => {
    const publicRoutes = [
      "/api/v1/auth/sign-in",
      "/api/v1/auth/sign-up",
      "/api/v1/auth/refresh-token",
      "/api/v1/auth/confirm",
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

  const videoRepository = deps?.videoRepository ?? new VideosCachedRepository(new VideosPostgresRepository(db), redis)
  const transcriptionsRepository = deps?.transcriptionsRepository ?? new TranscriptionsPostgresRepository(db)
  const chaptersRepository = deps?.chaptersRepository ?? new ChaptersPostgresRepository(db)
  const refreshTokensRepository = deps?.refreshTokensRepository ?? new RefreshTokensPostgresRepository(db)

  const videoProcessingQueue =
    deps?.videoProcessingQueue ??
    (config.NODE_ENV === 'test'
      ? new InMemoryVideoProcessingQueue()
      : new BullMQVideoProcessingQueue(getRedisConnectionOptions()))

  const accessTokenExpiresIn = config.JWT_ACCESS_TOKEN_EXPIRES_IN
  const refreshTokenExpiresInDays = config.REFRESH_TOKEN_EXPIRES_IN_DAYS
  const confirmationTokenExpiresInHours = config.CONFIRMATION_TOKEN_EXPIRES_IN_HOURS
  const refreshTokenGenerator = new RefreshTokenGenerator()
  const confirmationTokenGenerator = new ConfirmationTokenGenerator()

  const createChaptersUseCase = new CreateChaptersUseCase(videoRepository, chaptersRepository)
  const getChaptersByVideoIdUseCase = new GetChaptersByVideoIdUseCase(videoRepository, chaptersRepository)
  const deleteChaptersUseCase = new DeleteChaptersUseCase(videoRepository, chaptersRepository)
  const createChapterHandler = new CreateChapterHandler(createChaptersUseCase)
  const getChapterByVideoIdHandler = new GetChapterByVideoIdHandler(getChaptersByVideoIdUseCase)
  const deleteChapterHandler = new DeleteChapterHandler(deleteChaptersUseCase)
  const createVideoUseCase = new CreateVideoUseCase(videoRepository, videoProcessingQueue)
  const getVideosUseCase = new GetVideosUseCase(videoRepository)
  const getVideoByIdUseCase = new GetVideoByIdUseCase(videoRepository)
  const createVideoHandler = new CreateVideoHandler(createVideoUseCase)
  const getVideosHandler = new GetVideosHandler(getVideosUseCase)
  const getVideoByIdHandler = new GetVideoByIdHandler(getVideoByIdUseCase)
  const createTranscriptionUseCase = new CreateTranscriptionUseCase(videoRepository, transcriptionsRepository)
  const getTranscriptionByVideoIdUseCase = new GetTranscriptionByVideoIdUseCase(videoRepository, transcriptionsRepository)
  const deleteTranscriptionUseCase = new DeleteTranscriptionUseCase(videoRepository, transcriptionsRepository)
  const createTranscriptionHandler = new CreateTranscriptionHandler(createTranscriptionUseCase)
  const getTranscriptionByVideoIdHandler = new GetTranscriptionByVideoIdHandler(getTranscriptionByVideoIdUseCase)
  const deleteTranscriptionHandler = new DeleteTranscriptionHandler(deleteTranscriptionUseCase)
  const createUserUseCase = new CreateUserUseCase(
    usersRepository,
    confirmationTokenGenerator,
    confirmationTokenExpiresInHours,
  )
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
  const confirmAccountUseCase = new ConfirmAccountUseCase(usersRepository)
  const confirmAccountHandler = new ConfirmAccountHandler(confirmAccountUseCase)

  app.register(videoRoutes, { createVideoHandler, getVideosHandler, getVideoByIdHandler })
  app.register(transcriptionsRoutes, { createTranscriptionHandler, getTranscriptionByVideoIdHandler, deleteTranscriptionHandler })
  app.register(chaptersRoutes, { createChapterHandler, getChapterByVideoIdHandler, deleteChapterHandler })
  app.register(usersRoutes, { createUserHandler, signInHandler, refreshTokenHandler, signOutHandler, confirmAccountHandler })

  if (deps?.enableVideoProcessingWorker && config.NODE_ENV !== 'test') {
    const connection = getRedisConnectionOptions()
    const transcriptionsWorker = buildTranscriptionsWorker(connection, { createTranscriptionUseCase })
    const chaptersWorker = buildChaptersWorker(connection, { createChaptersUseCase })

    app.addHook('onClose', async () => {
      await transcriptionsWorker.close()
      await chaptersWorker.close()
    })
  }

  app.addHook('onClose', async () => {
    await videoProcessingQueue.close()
  })

  return app
}
