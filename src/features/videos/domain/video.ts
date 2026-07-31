import { nanoid } from 'nanoid'

export class Video {
  constructor(
    public readonly id: string,
    public readonly videoUrl: string,
    public readonly videoId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: string,
  ) {}

  static create(params: { videoUrl: string; videoId: string; createdBy: string }) {
    const now = new Date()
    return new Video(nanoid(), params.videoUrl, params.videoId, now, now, params.createdBy)
  }

  static toEntity(data: {
    id: string
    videoUrl: string
    videoId: string
    createdAt: Date
    updatedAt: Date
    createdBy: string
  }) {
    return new Video(data.id, data.videoUrl, data.videoId, data.createdAt, data.updatedAt, data.createdBy)
  }
}
