import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { chapterAgent } from './agent.ts'
import { chaptersMastra } from './mastra.ts'
import { youtubeTranscriptWithTimestampsTool } from './tools/youtube-transcript-with-timestamps-tool.ts'

describe('chapterAgent', () => {
  it('deve instanciar com id, nome e modelo definidos', () => {
    assert.strictEqual(chapterAgent.id, 'chapter-agent')
    assert.strictEqual(chapterAgent.name, 'Chapter Agent')
  })

  it('deve expor instruções sobre geração de capítulos', async () => {
    const instructions = (await chapterAgent.getInstructions()) as unknown as string
    assert.match(instructions, /capítulo/i)
    assert.match(instructions, /MM:SS/i)
  })

  it('deve registrar a ferramenta de transcrição com timestamps', () => {
    assert.strictEqual(youtubeTranscriptWithTimestampsTool.id, 'youtube-transcript-with-timestamps')
  })
})

describe('chaptersMastra', () => {
  it('deve recuperar o agente pelo id', () => {
    const agent = chaptersMastra.getAgentById('chapter-agent')
    assert.strictEqual(agent, chapterAgent)
  })
})
