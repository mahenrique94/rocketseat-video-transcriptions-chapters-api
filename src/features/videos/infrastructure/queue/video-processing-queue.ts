export interface IVideoProcessingQueue {
  addTranscriptionJob(videoId: string): Promise<void>
  addChaptersJob(videoId: string): Promise<void>
  close(): Promise<void>
}
