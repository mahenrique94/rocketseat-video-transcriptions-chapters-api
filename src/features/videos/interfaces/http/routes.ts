import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from '@fastify/type-provider-zod'
import type { IVideosRepository } from '../../infrastructure/storage/videos-repository.ts'
import {
  createVideoSchema,
  videoListSchema,
  videoParamsSchema,
  videoSchema,
  errorResponseSchema,
} from './schemas.ts'
import { Video } from '@features/videos/domain/video'
import { extractVideoId } from '@features/videos/domain/services/extract-video-id'

export async function videoRoutes(
  app: FastifyInstance,
  opts: { videoRepository: IVideosRepository },
) {
  const { videoRepository } = opts

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/v2/videos',
    schema: { response: { 200: videoListSchema, 500: errorResponseSchema } },
    handler: async (_request, reply) => {
      const videosList = await videoRepository.getVideos()
      return reply.send(videosList)
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/v2/videos/:id',
    schema: {
      params: videoParamsSchema,
      response: { 200: videoSchema, 404: errorResponseSchema, 500: errorResponseSchema },
    },
    handler: async (request, reply) => {
      const { id } = request.params
      const video = await videoRepository.getVideoById(id)
      if (!video) {
        return reply.status(404).send({ message: 'Vídeo não encontrado' })
      }
      return reply.send(video)
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/v2/videos',
    schema: {
      body: createVideoSchema,
      response: { 201: videoSchema, 400: errorResponseSchema, 500: errorResponseSchema },
    },
    handler: async (request, reply) => {
      const { url } = request.body
      const videoId = extractVideoId(url)
      const video = Video.create({ videoUrl: url, videoId, createdBy: request.user.id })
      const created = await videoRepository.createVideo(video)
      return reply.status(201).send(created)
    },
  })
}
