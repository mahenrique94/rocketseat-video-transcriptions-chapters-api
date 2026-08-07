import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from '@fastify/type-provider-zod'
import type { CreateVideoHandler } from './handlers/create-video-handler'
import type { GetVideosHandler } from './handlers/get-videos-handler'
import type { GetVideoByIdHandler } from './handlers/get-video-by-id-handler'
import {
  createVideoSchema,
  videoListSchema,
  videoParamsSchema,
  videoSchema,
  errorResponseSchema,
} from './schemas.ts'

export async function videoRoutes(
  app: FastifyInstance,
  opts: {
    createVideoHandler: CreateVideoHandler
    getVideosHandler: GetVideosHandler
    getVideoByIdHandler: GetVideoByIdHandler
  },
) {
  const { createVideoHandler, getVideosHandler, getVideoByIdHandler } = opts

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/v2/videos',
    schema: { response: { 200: videoListSchema, 500: errorResponseSchema } },
    handler: (request, reply) => getVideosHandler.execute(request, reply),
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/v2/videos/:id',
    schema: {
      params: videoParamsSchema,
      response: { 200: videoSchema, 404: errorResponseSchema, 500: errorResponseSchema },
    },
    handler: (request, reply) => getVideoByIdHandler.execute(request, reply),
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/v2/videos',
    schema: {
      body: createVideoSchema,
      response: { 201: videoSchema, 400: errorResponseSchema, 500: errorResponseSchema },
    },
    handler: (request, reply) => createVideoHandler.execute(request, reply),
  })
}
