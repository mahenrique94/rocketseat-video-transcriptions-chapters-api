import { Chapter } from '@features/chapters/domain/chapter'
import type { IChaptersRepository } from './chapters-repository.ts'

export class ChaptersInMemoryRepository implements IChaptersRepository {
  private chapters: Chapter[] = []

  async getChaptersByVideoId(videoId: string): Promise<Chapter | undefined> {
    return this.chapters.find((chapter) => {
      return chapter.videoId === videoId && chapter.deletedAt === null
    })
  }

  async createChapters(chapter: Chapter): Promise<Chapter> {
    this.chapters.push(chapter)
    return chapter
  }

  async softDeleteChapters(videoId: string): Promise<void> {
    const found = this.chapters.find((chapter) => {
      return chapter.videoId === videoId && chapter.deletedAt === null
    })

    if (found) {
      const index = this.chapters.indexOf(found)
      const now = new Date()
      this.chapters[index] = new Chapter(
        found.id,
        found.videoId,
        found.content,
        found.createdAt,
        now,
        now,
      )
    }
  }
}
