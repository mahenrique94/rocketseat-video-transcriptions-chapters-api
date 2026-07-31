import type { Chapter } from '@features/chapters/domain/chapter'

export interface IChaptersRepository {
  getChaptersByVideoId(videoId: string): Promise<Chapter | undefined>
  createChapters(chapter: Chapter): Promise<Chapter>
  softDeleteChapters(videoId: string): Promise<void>
}
