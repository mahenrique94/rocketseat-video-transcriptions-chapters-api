import type { Transcription } from '@features/transcriptions/domain/transcription'

export interface ITranscriptionsRepository {
  getTranscriptionByVideoId(videoId: string): Promise<Transcription | undefined>
  createTranscription(transcription: Transcription): Promise<Transcription>
  softDeleteTranscription(videoId: string): Promise<void>
}
