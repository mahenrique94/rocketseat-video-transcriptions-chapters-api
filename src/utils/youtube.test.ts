import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { extractVideoId } from './youtube.ts'

describe('extractVideoId', () => {
  it('deve extrair ID de URL youtube.com/watch?v=', () => {
    assert.strictEqual(
      extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
      'dQw4w9WgXcQ',
    )
  })

  it('deve extrair ID de URL youtu.be/', () => {
    assert.strictEqual(
      extractVideoId('https://youtu.be/dQw4w9WgXcQ'),
      'dQw4w9WgXcQ',
    )
  })

  it('deve extrair ID de URL youtube.com/embed/', () => {
    assert.strictEqual(
      extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ'),
      'dQw4w9WgXcQ',
    )
  })

  it('deve extrair ID de URL youtube.com/v/', () => {
    assert.strictEqual(
      extractVideoId('https://www.youtube.com/v/dQw4w9WgXcQ'),
      'dQw4w9WgXcQ',
    )
  })

  it('deve extrair ID de URL youtube.com/shorts/', () => {
    assert.strictEqual(
      extractVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ'),
      'dQw4w9WgXcQ',
    )
  })

  it('deve retornar a própria URL quando não encontrar padrão', () => {
    assert.strictEqual(
      extractVideoId('https://example.com/video'),
      'https://example.com/video',
    )
  })

  it('deve retornar a própria URL para string aleatória', () => {
    assert.strictEqual(
      extractVideoId('string sem url'),
      'string sem url',
    )
  })
})
