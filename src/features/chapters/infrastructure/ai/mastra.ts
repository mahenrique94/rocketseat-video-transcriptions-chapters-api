import { Mastra } from '@mastra/core'
import { chapterAgent } from './agent'

export const chaptersMastra = new Mastra({
  agents: { chapterAgent },
})
