import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from '@fastify/type-provider-zod'
import { createTranscription, transcriptions } from '../db/transcriptions.ts'
import { createTranscriptionSchema } from '../schemas/transcriptions.ts'
import { extractYoutubeId } from '../utils/youtube.ts'

export async function transcriptionRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/api/v1/video/transcription',
    async (request, reply) => {
      return reply.send(transcriptions)
    },
  )

  app.withTypeProvider<ZodTypeProvider>().post(
    '/api/v1/video/transcription',
    {
      schema: {
        body: createTranscriptionSchema,
      },
    },
    async (request, reply) => {
      const { url } = request.body

      const youtubeId = extractYoutubeId(url)

      createTranscription(url, youtubeId, request.user.id)

      return reply.status(201).send({ message: 'Transcription created successfully' })
    },
  )
}


