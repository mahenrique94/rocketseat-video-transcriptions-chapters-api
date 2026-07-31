import { z } from 'zod/v4'

export const chapterSchema = z
  .object({
    id: z.string().describe('ID único dos capítulos'),
    videoId: z.string().describe('ID do vídeo'),
    content: z.string().describe('Conteúdo dos capítulos no formato MM:SS seguido do título, um por linha'),
    createdAt: z.date().describe('Data de criação'),
    updatedAt: z.date().describe('Data de atualização'),
  })
  .describe('Capítulos de um vídeo')

export const chapterResponseSchema = z
  .object({
    chapters: chapterSchema,
  })
  .describe('Resposta com capítulos')

export const deleteChapterResponseSchema = z
  .object({
    message: z.string().describe('Mensagem de confirmação'),
  })
  .describe('Resposta de exclusão')
