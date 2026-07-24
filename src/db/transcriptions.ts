import { nanoid } from 'nanoid'

export interface Transcription {
  id: string
  created_at: string
  created_by: string
  updated_at: string
  content: string
  youtube_url: string
  youtube_id: string
}

export const transcriptions: Transcription[] = []

export function createTranscription(
  youtubeUrl: string,
  youtubeId: string,
  userId: string,
): Transcription {
  const now = new Date().toISOString()
  const transcription: Transcription = {
    id: nanoid(),
    created_at: now,
    created_by: userId,
    updated_at: now,
    content: 'Fake transcription content',
    youtube_url: youtubeUrl,
    youtube_id: youtubeId,
  }
  transcriptions.push(transcription)
  return transcription
}
