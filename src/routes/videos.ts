import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from '@fastify/type-provider-zod'
import { createVideo, getVideoById, getVideos } from '../db/videos.ts'
import {
  createTranscription,
  getTranscriptionByVideoId,
  softDeleteTranscription,
} from '../db/transcriptions.ts'
import {
  createVideoSchema,
  videoListSchema,
  videoParamsSchema,
  videoSchema,
  errorResponseSchema,
  transcriptionResponseSchema,
  deleteTranscriptionResponseSchema,
} from '../schemas/videos.ts'
import { extractVideoId } from '../utils/youtube.ts'
import { mastra } from '../mastra/index.ts'

export async function videoRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/v2/videos',
    schema: {
      response: {
        200: videoListSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (_request, reply) => {
      const videosList = await getVideos()
      return reply.send(videosList)
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/v2/videos/:id',
    schema: {
      params: videoParamsSchema,
      response: {
        200: videoSchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params
      const video = await getVideoById(id)

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
      response: {
        201: videoSchema,
        400: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { url } = request.body

      const videoId = extractVideoId(url)

      const video = await createVideo(url, videoId, request.user.id)

      return reply.status(201).send(video)
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/v2/videos/:id/transcriptions',
    schema: {
      params: videoParamsSchema,
      response: {
        201: transcriptionResponseSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
        409: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params

      const video = await getVideoById(id)
      if (!video) {
        return reply.status(404).send({ message: 'Vídeo não encontrado' })
      }

      const existing = await getTranscriptionByVideoId(id)
      if (existing) {
        return reply.status(409).send({ message: 'Vídeo já possui uma transcrição' })
      }

      const agent = mastra.getAgentById('transcription-agent')
      const response = await agent.generate(
        `Transcreva o vídeo do YouTube com ID: ${video.videoId}`,
      )

      const transcription = await createTranscription(id, response.text)

      return reply.status(201).send({ transcription })
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/v2/videos/:id/transcriptions',
    schema: {
      params: videoParamsSchema,
      response: {
        200: transcriptionResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params

      const video = await getVideoById(id)
      if (!video) {
        return reply.status(404).send({ message: 'Vídeo não encontrado' })
      }

      const transcription = await getTranscriptionByVideoId(id)
      if (!transcription) {
        return reply.status(404).send({ message: 'Transcrição não encontrada' })
      }

      return reply.send({ transcription })
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/api/v2/videos/:id/transcriptions',
    schema: {
      params: videoParamsSchema,
      response: {
        200: deleteTranscriptionResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params

      const video = await getVideoById(id)
      if (!video) {
        return reply.status(404).send({ message: 'Vídeo não encontrado' })
      }

      const existing = await getTranscriptionByVideoId(id)
      if (!existing) {
        return reply.status(404).send({ message: 'Transcrição não encontrada' })
      }

      await softDeleteTranscription(id)

      return reply.send({ message: 'Transcrição removida com sucesso' })
    },
  })
}
