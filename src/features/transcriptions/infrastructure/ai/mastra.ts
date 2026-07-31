import { Mastra } from '@mastra/core'
import { transcriptionAgent } from './agent'

export const transcriptionsMastra = new Mastra({
  agents: { transcriptionAgent },
})
