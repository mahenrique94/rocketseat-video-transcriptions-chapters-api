import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Video } from './video.ts'

describe('Video', () => {
  it('create deve retornar entidade com id gerado e timestamps', () => {
    const video = Video.create({
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
      videoId: 'dQw4w9WgXcQ',
      createdBy: 'user-001',
    })

    assert.ok(video.id)
    assert.strictEqual(video.videoUrl, 'https://youtu.be/dQw4w9WgXcQ')
    assert.strictEqual(video.videoId, 'dQw4w9WgXcQ')
    assert.strictEqual(video.createdBy, 'user-001')
    assert.ok(video.createdAt instanceof Date)
    assert.ok(video.updatedAt instanceof Date)
    assert.strictEqual(video.createdAt, video.updatedAt)
  })

  it('toEntity deve preservar os dados informados', () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z')
    const updatedAt = new Date('2024-01-02T00:00:00.000Z')

    const video = Video.toEntity({
      id: 'video-001',
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
      videoId: 'dQw4w9WgXcQ',
      createdAt,
      updatedAt,
      createdBy: 'user-001',
    })

    assert.strictEqual(video.id, 'video-001')
    assert.strictEqual(video.videoUrl, 'https://youtu.be/dQw4w9WgXcQ')
    assert.strictEqual(video.videoId, 'dQw4w9WgXcQ')
    assert.strictEqual(video.createdAt, createdAt)
    assert.strictEqual(video.updatedAt, updatedAt)
    assert.strictEqual(video.createdBy, 'user-001')
  })
})
