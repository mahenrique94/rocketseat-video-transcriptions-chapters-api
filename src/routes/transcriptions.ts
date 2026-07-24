import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from '@fastify/type-provider-zod'
import { createTranscription, getTranscriptions } from '../db/transcriptions.ts'
import { createTranscriptionSchema } from '../schemas/transcriptions.ts'
import { extractYoutubeId } from '../utils/youtube.ts'

export async function transcriptionRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/api/v1/video/transcriptions',
    async (request, reply) => {
      const transcriptions = await getTranscriptions()
      return reply.send(transcriptions)
    },
  )

  app.withTypeProvider<ZodTypeProvider>().post(
    '/api/v1/video/transcriptions',
    {
      schema: {
        body: createTranscriptionSchema,
      },
    },
    async (request, reply) => {
      const { url } = request.body

      const youtubeId = extractYoutubeId(url)

      await createTranscription(url, youtubeId, request.user.id)

      return reply.status(201).send({ message: 'Transcription created successfully' })
    },
  )
}


