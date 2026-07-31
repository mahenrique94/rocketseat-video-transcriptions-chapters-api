import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { transcriptionAgent } from './agent.ts'
import { transcriptionsMastra } from './mastra.ts'
import { youtubeTranscriptTool } from './tools/youtube-transcript-tool.ts'

describe('transcriptionAgent', () => {
  it('deve instanciar com id, nome e modelo definidos', () => {
    assert.strictEqual(transcriptionAgent.id, 'transcription-agent')
    assert.strictEqual(transcriptionAgent.name, 'Transcription Agent')
  })

  it('deve expor instruções sobre transcrição', async () => {
    const instructions = (await transcriptionAgent.getInstructions()) as unknown as string
    assert.match(instructions, /transcri/i)
  })

  it('deve registrar a ferramenta de transcrição', () => {
    assert.strictEqual(youtubeTranscriptTool.id, 'youtube-transcript')
  })
})

describe('transcriptionsMastra', () => {
  it('deve recuperar o agente pelo id', () => {
    const agent = transcriptionsMastra.getAgentById('transcription-agent')
    assert.strictEqual(agent, transcriptionAgent)
  })
})
