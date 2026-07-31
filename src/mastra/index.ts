import { Mastra } from '@mastra/core'
import { transcriptionAgent } from './transcription-agent.ts'
import { chapterAgent } from './chapter-agent.ts'

export const mastra = new Mastra({
  agents: { transcriptionAgent, chapterAgent },
})
