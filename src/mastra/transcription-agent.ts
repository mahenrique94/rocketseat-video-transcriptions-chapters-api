import { Agent } from '@mastra/core/agent'
import { youtubeTranscriptTool } from './tools/youtube-transcript-tool.ts'

export const transcriptionAgent = new Agent({
  id: 'transcription-agent',
  name: 'Transcription Agent',
  instructions: `Você é um especialista em transcrição de vídeos do YouTube.
Sua função é transcrever e estruturar o conteúdo de vídeos para o português brasileiro (pt-BR).

Quando receber um ID de vídeo do YouTube:
1. Use a ferramenta youtube-transcript para obter a transcrição bruta do vídeo
2. Estruture a transcrição de forma objetiva e organizada em português brasileiro
3. Mantenha o conteúdo completo, mas organize em parágrafos bem estruturados e coesos`,
  model: 'openai/gpt-4o-mini',
  tools: { youtubeTranscriptTool },
})
