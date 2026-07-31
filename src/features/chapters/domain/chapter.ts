import { nanoid } from 'nanoid'

export class Chapter {
  constructor(
    public readonly id: string,
    public readonly videoId: string,
    public readonly content: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}

  static create(params: { videoId: string; content: string }) {
    const now = new Date()
    return new Chapter(nanoid(), params.videoId, params.content, now, now, null)
  }

  static toEntity(data: {
    id: string
    videoId: string
    content: string
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
  }) {
    return new Chapter(data.id, data.videoId, data.content, data.createdAt, data.updatedAt, data.deletedAt)
  }
}
