import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

mock.module('youtube-transcript', {
  exports: {
    fetchTranscript: async (videoId: string) => {
      if (videoId === 'video-com-erro') {
        throw new Error('transcrição indisponível')
      }

      return [
        { text: 'Introdução', offset: 0, duration: 60 },
        { text: 'Novo tópico', offset: 65, duration: 30 },
        { text: 'Encerramento', offset: 3661, duration: 10 },
      ]
    },
  },
})

const { youtubeTranscriptWithTimestampsTool } = await import('./youtube-transcript-with-timestamps-tool.ts')

type ExecuteFn = (input: { videoId: string }) => Promise<{ transcriptWithTimestamps: string }>
const execute = youtubeTranscriptWithTimestampsTool.execute as unknown as ExecuteFn

describe('youtubeTranscriptWithTimestampsTool', () => {
  it('deve formatar a transcrição com timestamps MM:SS por linha', async () => {
    const result = await execute({ videoId: 'dQw4w9WgXcQ' })

    assert.strictEqual(
      result.transcriptWithTimestamps,
      '[00:00] Introdução\n[01:05] Novo tópico\n[61:01] Encerramento',
    )
  })

  it('deve repassar erros do fetchTranscript', async () => {
    await assert.rejects(
      execute({ videoId: 'video-com-erro' }),
      /transcrição indisponível/,
    )
  })
})
