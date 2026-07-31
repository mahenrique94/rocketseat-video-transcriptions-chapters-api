import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Chapter } from './chapter.ts'

describe('Chapter', () => {
  it('create deve retornar entidade com id gerado e timestamps', () => {
    const chapter = Chapter.create({
      videoId: 'video-001',
      content: '00:00 Introdução\n01:00 Tópico',
    })

    assert.ok(chapter.id)
    assert.strictEqual(chapter.videoId, 'video-001')
    assert.strictEqual(chapter.content, '00:00 Introdução\n01:00 Tópico')
    assert.ok(chapter.createdAt instanceof Date)
    assert.ok(chapter.updatedAt instanceof Date)
    assert.strictEqual(chapter.deletedAt, null)
    assert.strictEqual(chapter.createdAt, chapter.updatedAt)
  })

  it('toEntity deve preservar os dados informados', () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z')
    const updatedAt = new Date('2024-01-02T00:00:00.000Z')
    const deletedAt = new Date('2024-01-03T00:00:00.000Z')

    const chapter = Chapter.toEntity({
      id: 'chapter-001',
      videoId: 'video-001',
      content: '00:00 Introdução',
      createdAt,
      updatedAt,
      deletedAt,
    })

    assert.strictEqual(chapter.id, 'chapter-001')
    assert.strictEqual(chapter.videoId, 'video-001')
    assert.strictEqual(chapter.content, '00:00 Introdução')
    assert.strictEqual(chapter.createdAt, createdAt)
    assert.strictEqual(chapter.updatedAt, updatedAt)
    assert.strictEqual(chapter.deletedAt, deletedAt)
  })
})
