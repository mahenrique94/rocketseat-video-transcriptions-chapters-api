import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from '@fastify/type-provider-zod'
import type { CreateChapterHandler } from './handlers/create-chapter-handler'
import type { GetChapterByVideoIdHandler } from './handlers/get-chapter-by-video-id-handler'
import type { DeleteChapterHandler } from './handlers/delete-chapter-handler'
import {
  chapterResponseSchema,
  deleteChapterResponseSchema,
} from './schemas.ts'
import { videoParamsSchema, errorResponseSchema } from '@features/videos/interfaces/http/schemas'

export async function chaptersRoutes(
  app: FastifyInstance,
  opts: {
    createChapterHandler: CreateChapterHandler
    getChapterByVideoIdHandler: GetChapterByVideoIdHandler
    deleteChapterHandler: DeleteChapterHandler
  },
) {
  const { createChapterHandler, getChapterByVideoIdHandler, deleteChapterHandler } = opts

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/v2/videos/:id/chapters',
    schema: {
      params: videoParamsSchema,
      response: {
        201: chapterResponseSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
        409: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: (request, reply) => createChapterHandler.execute(request, reply),
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/v2/videos/:id/chapters',
    schema: {
      params: videoParamsSchema,
      response: { 200: chapterResponseSchema, 404: errorResponseSchema, 500: errorResponseSchema },
    },
    handler: (request, reply) => getChapterByVideoIdHandler.execute(request, reply),
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/api/v2/videos/:id/chapters',
    schema: {
      params: videoParamsSchema,
      response: { 200: deleteChapterResponseSchema, 404: errorResponseSchema, 500: errorResponseSchema },
    },
    handler: (request, reply) => deleteChapterHandler.execute(request, reply),
  })
}
