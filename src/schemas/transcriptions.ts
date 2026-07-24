import { z } from 'zod/v4'

export const createTranscriptionSchema = z.object({
  url: z.url(),
})

export type CreateTranscriptionInput = z.infer<typeof createTranscriptionSchema>
