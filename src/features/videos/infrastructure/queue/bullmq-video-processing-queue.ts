import { Queue } from 'bullmq'
import type { ConnectionOptions } from 'bullmq'
import {
  TRANSCRIPTIONS_QUEUE_NAME,
  GENERATE_TRANSCRIPTION_JOB,
} from '@features/transcriptions/interfaces/workers'
import {
  CHAPTERS_QUEUE_NAME,
  GENERATE_CHAPTERS_JOB,
} from '@features/chapters/interfaces/workers'
import type { IVideoProcessingQueue } from './video-processing-queue'

const JOB_ATTEMPTS = 3

export class BullMQVideoProcessingQueue implements IVideoProcessingQueue {
  private readonly transcriptionQueue: Queue
  private readonly chaptersQueue: Queue

  constructor(connection: ConnectionOptions) {
    this.transcriptionQueue = new Queue(TRANSCRIPTIONS_QUEUE_NAME, { connection })
    this.chaptersQueue = new Queue(CHAPTERS_QUEUE_NAME, { connection })
  }

  async addTranscriptionJob(videoId: string): Promise<void> {
    await this.transcriptionQueue.add(GENERATE_TRANSCRIPTION_JOB, { videoId }, {
      attempts: JOB_ATTEMPTS,
      backoff: { type: 'exponential', delay: 5000 },
    })
  }

  async addChaptersJob(videoId: string): Promise<void> {
    await this.chaptersQueue.add(GENERATE_CHAPTERS_JOB, { videoId }, {
      attempts: JOB_ATTEMPTS,
      backoff: { type: 'exponential', delay: 5000 },
    })
  }

  async close(): Promise<void> {
    await Promise.all([
      this.transcriptionQueue.close(),
      this.chaptersQueue.close(),
    ])
  }
}
