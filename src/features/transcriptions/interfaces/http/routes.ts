import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from '@fastify/type-provider-zod'
import type { CreateTranscriptionHandler } from './handlers/create-transcription-handler'
import type { GetTranscriptionByVideoIdHandler } from './handlers/get-transcription-by-video-id-handler'
import type { DeleteTranscriptionHandler } from './handlers/delete-transcription-handler'
import {
  transcriptionResponseSchema,
  deleteTranscriptionResponseSchema,
} from './schemas.ts'
import { videoParamsSchema, errorResponseSchema } from '@features/videos/interfaces/http/schemas'

export async function transcriptionsRoutes(
  app: FastifyInstance,
  opts: {
    createTranscriptionHandler: CreateTranscriptionHandler
    getTranscriptionByVideoIdHandler: GetTranscriptionByVideoIdHandler
    deleteTranscriptionHandler: DeleteTranscriptionHandler
  },
) {
  const {
    createTranscriptionHandler,
    getTranscriptionByVideoIdHandler,
    deleteTranscriptionHandler,
  } = opts

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
    handler: (request, reply) => createTranscriptionHandler.execute(request, reply),
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/v2/videos/:id/transcriptions',
    schema: {
      params: videoParamsSchema,
      response: { 200: transcriptionResponseSchema, 404: errorResponseSchema, 500: errorResponseSchema },
    },
    handler: (request, reply) => getTranscriptionByVideoIdHandler.execute(request, reply),
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/api/v2/videos/:id/transcriptions',
    schema: {
      params: videoParamsSchema,
      response: { 200: deleteTranscriptionResponseSchema, 404: errorResponseSchema, 500: errorResponseSchema },
    },
    handler: (request, reply) => deleteTranscriptionHandler.execute(request, reply),
  })
}
