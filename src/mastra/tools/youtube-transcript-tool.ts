import { createTool } from '@mastra/core/tools'
import { z } from 'zod/v4'
import { fetchTranscript } from 'youtube-transcript'

export const youtubeTranscriptTool = createTool({
  id: 'youtube-transcript',
  description: 'Obtém a transcrição bruta de um vídeo do YouTube',
  inputSchema: z.object({
    videoId: z.string().describe('ID do vídeo do YouTube'),
  }),
  execute: async ({ videoId }) => {
    const snippets = await fetchTranscript(videoId, { lang: 'pt' })
    const rawTranscript = snippets.map((s) => s.text).join(' ')
    return { rawTranscript }
  },
})
