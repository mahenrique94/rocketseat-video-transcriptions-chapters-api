import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

mock.module('youtube-transcript', {
  exports: {
    fetchTranscript: async (videoId: string) => {
      if (videoId === 'video-com-erro') {
        throw new Error('transcrição indisponível')
      }

      return [
        { text: 'Olá', offset: 0, duration: 2 },
        { text: 'mundo', offset: 2, duration: 3 },
        { text: 'este é o conteúdo', offset: 5, duration: 4 },
      ]
    },
  },
})

const { youtubeTranscriptTool } = await import('./youtube-transcript-tool.ts')

type ExecuteFn = (input: { videoId: string }) => Promise<{ rawTranscript: string }>
const execute = youtubeTranscriptTool.execute as unknown as ExecuteFn

describe('youtubeTranscriptTool', () => {
  it('deve unir os textos da transcrição', async () => {
    const result = await execute({ videoId: 'dQw4w9WgXcQ' })

    assert.deepStrictEqual(result, { rawTranscript: 'Olá mundo este é o conteúdo' })
  })

  it('deve repassar erros do fetchTranscript', async () => {
    await assert.rejects(
      execute({ videoId: 'video-com-erro' }),
      /transcrição indisponível/,
    )
  })
})
