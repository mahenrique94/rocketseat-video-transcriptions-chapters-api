import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { Session } from './session.ts'

describe('Session', () => {
  it('deve criar uma sessão com o hash do jti', () => {
    const session = Session.create({
      userId: 'user-001',
      jti: 'jti-123',
      expiresAt: new Date('2025-01-01T00:00:00.000Z'),
    })

    assert.strictEqual(session.jtiHash, Session.hashJti('jti-123'))
    assert.strictEqual(session.userId, 'user-001')
    assert.ok(session.id)
    assert.ok(session.createdAt instanceof Date)
  })

  it('deve gerar o hash de forma determinística em sha256', () => {
    const jti = 'jti-123'

    assert.strictEqual(
      Session.hashJti(jti),
      createHash('sha256').update(jti).digest('hex'),
    )
  })

  it('deve retornar expirado quando a data de expiração já passou', () => {
    const session = Session.create({
      userId: 'user-001',
      jti: 'jti-123',
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
    })

    assert.strictEqual(session.isExpired(new Date('2025-01-01T00:00:00.000Z')), true)
  })

  it('deve retornar não expirado antes da data de expiração', () => {
    const session = Session.create({
      userId: 'user-001',
      jti: 'jti-123',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    })

    assert.strictEqual(session.isExpired(new Date('2025-01-01T00:00:00.000Z')), false)
  })

  it('deve reconstruir a entidade a partir dos dados de persistência', () => {
    const session = Session.toEntity({
      id: 'session-001',
      jtiHash: 'hash',
      userId: 'user-001',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
    })

    assert.ok(session instanceof Session)
    assert.strictEqual(session.id, 'session-001')
    assert.strictEqual(session.jtiHash, 'hash')
  })
})
