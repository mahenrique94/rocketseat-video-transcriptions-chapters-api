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
import { CreateChapterHandler } from '@features/chapters/interfaces/http/handlers/create-chapter-handler'
import { GetChapterByVideoIdHandler } from '@features/chapters/interfaces/http/handlers/get-chapter-by-video-id-handler'
import { DeleteChapterHandler } from '@features/chapters/interfaces/http/handlers/delete-chapter-handler'
import { CreateChaptersUseCase } from '@features/chapters/application/create-chapters-use-case'
import { GetChaptersByVideoIdUseCase } from '@features/chapters/application/get-chapters-by-video-id-use-case'
import { DeleteChaptersUseCase } from '@features/chapters/application/delete-chapters-use-case'
import { isDbError, getDbError } from '@shared/utils/db-errors'
import type { UserPayload } from '@shared/types/fastify'
import type { IVideosRepository } from '@features/videos/infrastructure/storage/videos-repository'
import type { ITranscriptionsRepository } from '@features/transcriptions/infrastructure/storage/transcriptions-repository'
import type { IChaptersRepository } from '@features/chapters/infrastructure/storage/chapters-repository'
import db from '@shared/db/index'
import { VideosPostgresRepository } from '@features/videos/infrastructure/storage/videos-postgres-repository'
import { TranscriptionsPostgresRepository } from '@features/transcriptions/infrastructure/storage/transcriptions-postgres-repository'
import { ChaptersPostgresRepository } from '@features/chapters/infrastructure/storage/chapters-postgres-repository'

export interface AppDependencies {
  videoRepository?: IVideosRepository
  transcriptionsRepository?: ITranscriptionsRepository
  chaptersRepository?: IChaptersRepository
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
  app.addHook('preHandler', async (request) => {
    request.user = {
      id: 'user-001',
      name: 'Mock User',
      email: 'mock@example.com',
    }
  })

  const videoRepository = deps?.videoRepository ?? new VideosPostgresRepository(db)
  const transcriptionsRepository = deps?.transcriptionsRepository ?? new TranscriptionsPostgresRepository(db)
  const chaptersRepository = deps?.chaptersRepository ?? new ChaptersPostgresRepository(db)

  const createChaptersUseCase = new CreateChaptersUseCase(videoRepository, chaptersRepository)
  const getChaptersByVideoIdUseCase = new GetChaptersByVideoIdUseCase(videoRepository, chaptersRepository)
  const deleteChaptersUseCase = new DeleteChaptersUseCase(videoRepository, chaptersRepository)
  const createChapterHandler = new CreateChapterHandler(createChaptersUseCase)
  const getChapterByVideoIdHandler = new GetChapterByVideoIdHandler(getChaptersByVideoIdUseCase)
  const deleteChapterHandler = new DeleteChapterHandler(deleteChaptersUseCase)

  app.register(videoRoutes, { videoRepository })
  app.register(transcriptionsRoutes, { videoRepository, transcriptionsRepository })
  app.register(chaptersRoutes, { createChapterHandler, getChapterByVideoIdHandler, deleteChapterHandler })

  return app
}
