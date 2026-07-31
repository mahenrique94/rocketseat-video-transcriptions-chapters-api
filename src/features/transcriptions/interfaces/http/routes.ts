import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from '@fastify/type-provider-zod'
import type { IVideosRepository } from '../../../videos/infrastructure/storage/videos-repository'
import type { ITranscriptionsRepository } from '../../infrastructure/storage/transcriptions-repository'
import {
  transcriptionResponseSchema,
  deleteTranscriptionResponseSchema,
} from './schemas.ts'
import { videoParamsSchema, errorResponseSchema } from '@features/videos/interfaces/http/schemas'
import { Transcription } from '@features/transcriptions/domain/transcription'
import { transcriptionsMastra } from '@features/transcriptions/infrastructure/ai/mastra'

export async function transcriptionsRoutes(
  app: FastifyInstance,
  opts: { videoRepository: IVideosRepository; transcriptionsRepository: ITranscriptionsRepository },
) {
  const { videoRepository, transcriptionsRepository } = opts

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
      const video = await videoRepository.getVideoById(id)
      if (!video) {
        return reply.status(404).send({ message: 'Vídeo não encontrado' })
      }
      const existing = await transcriptionsRepository.getTranscriptionByVideoId(id)
      if (existing) {
        return reply.status(409).send({ message: 'Vídeo já possui uma transcrição' })
      }
      const agent = transcriptionsMastra.getAgentById('transcription-agent')
      const response = await agent.generate(
        `Transcreva o vídeo do YouTube com ID: ${video.videoId}`,
      )
      const transcription = Transcription.create({ videoId: id, content: response.text })
      const created = await transcriptionsRepository.createTranscription(transcription)
      return reply.status(201).send({ transcription: created })
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/v2/videos/:id/transcriptions',
    schema: {
      params: videoParamsSchema,
      response: { 200: transcriptionResponseSchema, 404: errorResponseSchema, 500: errorResponseSchema },
    },
    handler: async (request, reply) => {
      const { id } = request.params
      const video = await videoRepository.getVideoById(id)
      if (!video) {
        return reply.status(404).send({ message: 'Vídeo não encontrado' })
      }
      const transcription = await transcriptionsRepository.getTranscriptionByVideoId(id)
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
      response: { 200: deleteTranscriptionResponseSchema, 404: errorResponseSchema, 500: errorResponseSchema },
    },
    handler: async (request, reply) => {
      const { id } = request.params
      const video = await videoRepository.getVideoById(id)
      if (!video) {
        return reply.status(404).send({ message: 'Vídeo não encontrado' })
      }
      const existing = await transcriptionsRepository.getTranscriptionByVideoId(id)
      if (!existing) {
        return reply.status(404).send({ message: 'Transcrição não encontrada' })
      }
      await transcriptionsRepository.softDeleteTranscription(id)
      return reply.send({ message: 'Transcrição removida com sucesso' })
    },
  })
}
