import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Transcription } from './transcription.ts'

describe('Transcription', () => {
  it('create deve retornar entidade com id gerado e timestamps', () => {
    const transcription = Transcription.create({
      videoId: 'video-001',
      content: 'transcrição do vídeo',
    })

    assert.ok(transcription.id)
    assert.strictEqual(transcription.videoId, 'video-001')
    assert.strictEqual(transcription.content, 'transcrição do vídeo')
    assert.ok(transcription.createdAt instanceof Date)
    assert.ok(transcription.updatedAt instanceof Date)
    assert.strictEqual(transcription.deletedAt, null)
    assert.strictEqual(transcription.createdAt, transcription.updatedAt)
  })

  it('toEntity deve preservar os dados informados', () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z')
    const updatedAt = new Date('2024-01-02T00:00:00.000Z')
    const deletedAt = new Date('2024-01-03T00:00:00.000Z')

    const transcription = Transcription.toEntity({
      id: 'transcription-001',
      videoId: 'video-001',
      content: 'conteúdo',
      createdAt,
      updatedAt,
      deletedAt,
    })

    assert.strictEqual(transcription.id, 'transcription-001')
    assert.strictEqual(transcription.videoId, 'video-001')
    assert.strictEqual(transcription.content, 'conteúdo')
    assert.strictEqual(transcription.createdAt, createdAt)
    assert.strictEqual(transcription.updatedAt, updatedAt)
    assert.strictEqual(transcription.deletedAt, deletedAt)
  })
})
