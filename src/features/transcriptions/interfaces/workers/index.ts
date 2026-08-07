import { Worker } from 'bullmq'
import type { ConnectionOptions } from 'bullmq'
import type { CreateTranscriptionUseCase } from '../../application/create-transcription-use-case'
import { CreateTranscriptionDTO } from '../../application/dto/create-transcription.dto'
import { EntityAlreadyExists } from '@shared/exceptions/index'

export const TRANSCRIPTIONS_QUEUE_NAME = 'transcriptions'
export const GENERATE_TRANSCRIPTION_JOB = 'generate-transcription'

export interface TranscriptionsWorkerDeps {
  createTranscriptionUseCase: CreateTranscriptionUseCase
}

export function buildTranscriptionsWorker(
  connection: ConnectionOptions,
  deps: TranscriptionsWorkerDeps,
): Worker {
  return new Worker(
    TRANSCRIPTIONS_QUEUE_NAME,
    async (job) => {
      const { videoId } = job.data as { videoId: string }

      try {
        await deps.createTranscriptionUseCase.execute(new CreateTranscriptionDTO(videoId))
      } catch (error) {
        if (error instanceof EntityAlreadyExists) {
          return
        }
        throw error
      }
    },
    { connection },
  )
}
