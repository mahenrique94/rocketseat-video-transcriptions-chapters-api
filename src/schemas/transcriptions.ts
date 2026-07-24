import { z } from 'zod/v4'

export const createTranscriptionSchema = z.object({
  url: z.url().describe('URL do vídeo do YouTube'),
})

export type CreateTranscriptionInput = z.infer<typeof createTranscriptionSchema>

export const transcriptionSchema = z
  .object({
    id: z.string().describe('ID único da transcrição'),
    youtubeUrl: z.string().describe('URL do vídeo no YouTube'),
    youtubeId: z.string().describe('ID do vídeo no YouTube'),
    content: z.string().describe('Conteúdo da transcrição'),
    createdAt: z.date().describe('Data de criação'),
    updatedAt: z.date().describe('Data de atualização'),
    createdBy: z.string().describe('ID do usuário que criou'),
  })
  .describe('Uma transcrição de vídeo')

export const transcriptionListSchema = transcriptionSchema
  .array()
  .describe('Lista de transcrições')

export const transcriptionSchemaV2 = z
  .object({
    id: z.string().describe('ID único da transcrição'),
    videoUrl: z.string().describe('URL do vídeo'),
    videoId: z.string().describe('ID do vídeo'),
    content: z.string().describe('Conteúdo da transcrição'),
    createdAt: z.date().describe('Data de criação'),
    updatedAt: z.date().describe('Data de atualização'),
    createdBy: z.string().describe('ID do usuário que criou'),
  })
  .describe('Uma transcrição de vídeo (v2)')

export const transcriptionListSchemaV2 = transcriptionSchemaV2
  .array()
  .describe('Lista de transcrições (v2)')

export const messageResponseSchema = z
  .object({
    message: z.string().describe('Mensagem de retorno'),
  })
  .describe('Resposta de sucesso')

export const errorResponseSchema = z
  .object({
    message: z.string().describe('Mensagem de erro'),
    errors: z
      .unknown()
      .optional()
      .describe('Detalhes dos erros de validação'),
  })
  .describe('Resposta de erro')
