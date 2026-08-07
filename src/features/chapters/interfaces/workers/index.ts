import { Worker } from 'bullmq'
import type { ConnectionOptions } from 'bullmq'
import type { CreateChaptersUseCase } from '../../application/create-chapters-use-case'
import { CreateChapterDTO } from '../../application/dto/create-chapter.dto'
import { EntityAlreadyExists } from '@shared/exceptions/index'

export const CHAPTERS_QUEUE_NAME = 'chapters'
export const GENERATE_CHAPTERS_JOB = 'generate-chapters'

export interface ChaptersWorkerDeps {
  createChaptersUseCase: CreateChaptersUseCase
}

export function buildChaptersWorker(
  connection: ConnectionOptions,
  deps: ChaptersWorkerDeps,
): Worker {
  return new Worker(
    CHAPTERS_QUEUE_NAME,
    async (job) => {
      const { videoId } = job.data as { videoId: string }

      try {
        await deps.createChaptersUseCase.execute(new CreateChapterDTO(videoId))
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
