import { createTool } from '@mastra/core/tools'
import { z } from 'zod/v4'
import { fetchTranscript } from 'youtube-transcript'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const youtubeTranscriptWithTimestampsTool = createTool({
  id: 'youtube-transcript-with-timestamps',
  description:
    'Obtém a transcrição bruta de um vídeo do YouTube com timestamps e duração de cada trecho',
  inputSchema: z.object({
    videoId: z.string().describe('ID do vídeo do YouTube'),
  }),
  execute: async ({ videoId }) => {
    const snippets = await fetchTranscript(videoId, { lang: 'pt' })
    const transcriptWithTimestamps = snippets
      .map((s) => `[${formatTime(s.offset)}] ${s.text}`)
      .join('\n')
    return { transcriptWithTimestamps }
  },
})
