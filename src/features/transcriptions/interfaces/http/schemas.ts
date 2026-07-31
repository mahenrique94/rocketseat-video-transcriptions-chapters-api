import { z } from 'zod/v4'

export const transcriptionSchema = z
  .object({
    id: z.string().describe('ID único da transcrição'),
    videoId: z.string().describe('ID do vídeo'),
    content: z.string().describe('Conteúdo da transcrição'),
    createdAt: z.date().describe('Data de criação'),
    updatedAt: z.date().describe('Data de atualização'),
  })
  .describe('Uma transcrição')

export const transcriptionResponseSchema = z
  .object({
    transcription: transcriptionSchema,
  })
  .describe('Resposta com transcrição')

export const deleteTranscriptionResponseSchema = z
  .object({
    message: z.string().describe('Mensagem de confirmação'),
  })
  .describe('Resposta de exclusão')
