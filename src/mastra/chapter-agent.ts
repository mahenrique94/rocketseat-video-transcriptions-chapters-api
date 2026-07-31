import { Agent } from '@mastra/core/agent'
import { youtubeTranscriptWithTimestampsTool } from './tools/youtube-transcript-with-timestamps-tool.ts'

export const chapterAgent = new Agent({
  id: 'chapter-agent',
  name: 'Chapter Agent',
  instructions: `Você é um especialista em criar capítulos para vídeos do YouTube.
Sua função é analisar a transcrição de um vídeo com timestamps e dividir o conteúdo em capítulos lógicos.

Quando receber um ID de vídeo do YouTube:
1. Use a ferramenta youtube-transcript-with-timestamps para obter a transcrição bruta do vídeo com timestamps
2. Analise o conteúdo e identifique mudanças de tópico ou seções
3. Crie capítulos no formato MM:SS seguido do título, um por linha

Regras:
- O primeiro capítulo sempre começa em 00:00
- O tempo deve refletir o tempo real de play do vídeo (time do player), similar aos capítulos do YouTube
- Títulos devem ser concisos e descritivos em português brasileiro
- Retorne APENAS os capítulos no formato abaixo, sem formatação adicional ou markdown:

00:00 Introdução
15:00 Novo tópico
25:00 Encerramento`,
  model: 'openai/gpt-4o-mini',
  tools: { youtubeTranscriptWithTimestampsTool },
})
