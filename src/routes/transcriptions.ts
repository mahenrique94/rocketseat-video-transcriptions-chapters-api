import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from '@fastify/type-provider-zod'
import { createTranscription, getTranscriptions, getTranscriptionsV2 } from '../db/transcriptions.ts'
import {
  createTranscriptionSchema,
  transcriptionListSchema,
  transcriptionListSchemaV2,
  messageResponseSchema,
  errorResponseSchema,
} from '../schemas/transcriptions.ts'
import { extractYoutubeId } from '../utils/youtube.ts'

export async function transcriptionRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/v1/video/transcriptions',
    schema: {
      response: {
        200: transcriptionListSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (_request, reply) => {
      const transcriptions = await getTranscriptions()
      return reply.send(transcriptions)
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/v1/video/transcriptions',
    schema: {
      body: createTranscriptionSchema,
      response: {
        201: messageResponseSchema,
        400: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { url } = request.body

      const youtubeId = extractYoutubeId(url)

      await createTranscription(url, youtubeId, url, youtubeId, request.user.id)

      return reply.status(201).send({ message: 'Transcription created successfully' })
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/v2/video/transcriptions',
    schema: {
      response: {
        200: transcriptionListSchemaV2,
        500: errorResponseSchema,
      },
    },
    handler: async (_request, reply) => {
      const transcriptions = await getTranscriptionsV2()
      return reply.send(transcriptions)
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/v2/video/transcriptions',
    schema: {
      body: createTranscriptionSchema,
      response: {
        201: messageResponseSchema,
        400: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { url } = request.body

      const youtubeId = extractYoutubeId(url)

      await createTranscription(url, youtubeId, url, youtubeId, request.user.id)

      return reply.status(201).send({ message: 'Transcription created successfully' })
    },
  })
}

