import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { RefreshToken } from './refresh-token.ts'

describe('RefreshToken', () => {
  it('deve criar um refresh token com o hash do token original', () => {
    const token = 'segredo-aleatorio'
    const refreshToken = RefreshToken.create({
      userId: 'user-001',
      token,
      expiresAt: new Date('2025-01-01T00:00:00.000Z'),
    })

    assert.strictEqual(refreshToken.tokenHash, RefreshToken.hashToken(token))
    assert.strictEqual(refreshToken.userId, 'user-001')
    assert.strictEqual(refreshToken.revokedAt, null)
    assert.ok(refreshToken.id)
    assert.ok(refreshToken.createdAt instanceof Date)
  })

  it('deve gerar o hash de forma determinística em sha256', () => {
    const token = 'meu-token'

    assert.strictEqual(
      RefreshToken.hashToken(token),
      createHash('sha256').update(token).digest('hex'),
    )
  })

  it('deve retornar expirado quando a data de expiração já passou', () => {
    const refreshToken = RefreshToken.create({
      userId: 'user-001',
      token: 'token',
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
    })

    assert.strictEqual(refreshToken.isExpired(new Date('2025-01-01T00:00:00.000Z')), true)
  })

  it('deve retornar não expirado antes da data de expiração', () => {
    const refreshToken = RefreshToken.create({
      userId: 'user-001',
      token: 'token',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    })

    assert.strictEqual(refreshToken.isExpired(new Date('2025-01-01T00:00:00.000Z')), false)
  })

  it('deve retornar revogado após o método revoke', () => {
    const refreshToken = RefreshToken.create({
      userId: 'user-001',
      token: 'token',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    })

    const revoked = refreshToken.revoke(new Date('2025-01-01T00:00:00.000Z'))

    assert.strictEqual(revoked.isRevoked(), true)
    assert.strictEqual(revoked.revokedAt?.toISOString(), '2025-01-01T00:00:00.000Z')
    assert.strictEqual(refreshToken.isRevoked(), false)
  })

  it('deve reconstruir a entidade a partir dos dados de persistência', () => {
    const refreshToken = RefreshToken.toEntity({
      id: 'rt-001',
      tokenHash: 'hash',
      userId: 'user-001',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      revokedAt: null,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
    })

    assert.ok(refreshToken instanceof RefreshToken)
    assert.strictEqual(refreshToken.id, 'rt-001')
    assert.strictEqual(refreshToken.tokenHash, 'hash')
  })
})
