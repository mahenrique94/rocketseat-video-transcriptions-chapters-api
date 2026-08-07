import type { IVideoProcessingQueue } from './video-processing-queue'

export class InMemoryVideoProcessingQueue implements IVideoProcessingQueue {
  public readonly transcriptionJobs: string[] = []
  public readonly chaptersJobs: string[] = []

  async addTranscriptionJob(videoId: string): Promise<void> {
    this.transcriptionJobs.push(videoId)
  }

  async addChaptersJob(videoId: string): Promise<void> {
    this.chaptersJobs.push(videoId)
  }

  async close(): Promise<void> {}
}
