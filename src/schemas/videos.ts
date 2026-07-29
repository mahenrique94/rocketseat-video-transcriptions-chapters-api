import { z } from 'zod/v4'

export const createVideoSchema = z.object({
  url: z.url().describe('URL do vídeo'),
})

export type CreateVideoInput = z.infer<typeof createVideoSchema>

export const videoSchema = z
  .object({
    id: z.string().describe('ID único do vídeo'),
    videoUrl: z.string().describe('URL do vídeo'),
    videoId: z.string().describe('ID do vídeo'),
    createdAt: z.date().describe('Data de criação'),
    updatedAt: z.date().describe('Data de atualização'),
    createdBy: z.string().describe('ID do usuário que criou'),
  })
  .describe('Um vídeo')

export const videoListSchema = videoSchema
  .array()
  .describe('Lista de vídeos')

export const messageResponseSchema = z
  .object({
    message: z.string().describe('Mensagem de retorno'),
  })
  .describe('Resposta de sucesso')

export const videoParamsSchema = z.object({
  id: z.string().describe('ID do vídeo'),
}).describe('Parâmetros da requisição')

export const errorResponseSchema = z
  .object({
    message: z.string().describe('Mensagem de erro'),
    errors: z
      .unknown()
      .optional()
      .describe('Detalhes dos erros de validação'),
  })
  .describe('Resposta de erro')

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
