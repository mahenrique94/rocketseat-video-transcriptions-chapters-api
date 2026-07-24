import { nanoid } from 'nanoid'
import pool from './index.ts'

export interface Transcription {
  id: string
  created_at: string
  created_by: string
  updated_at: string
  content: string
  youtube_url: string
  youtube_id: string
}

export async function createTranscription(
  youtubeUrl: string,
  youtubeId: string,
  userId: string,
): Promise<Transcription> {
  const now = new Date().toISOString()
  const id = nanoid()

  const result = await pool.query<Transcription>(
    `INSERT INTO transcriptions (id, created_at, created_by, updated_at, content, youtube_url, youtube_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [id, now, userId, , 'Fake transcription content', youtubeUrl, youtubeId],
  )

  return result.rows[0]
}

export async function getTranscriptions(): Promise<Transcription[]> {
  const result = await pool.query<Transcription>(
    'SELECT * FROM transcriptions ORDER BY created_at DESC',
  )

  return result.rows
}
