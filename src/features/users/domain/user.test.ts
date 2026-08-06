import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { User } from './user.ts'

describe('User', () => {
  it('create deve retornar entidade inativa, com id gerado e sem deletedAt', () => {
    const user = User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'secret123',
    })

    assert.ok(user.id)
    assert.strictEqual(user.firstName, 'John')
    assert.strictEqual(user.lastName, 'Doe')
    assert.strictEqual(user.email, 'john@example.com')
    assert.strictEqual(user.password, 'secret123')
    assert.ok(user.createdAt instanceof Date)
    assert.ok(user.updatedAt instanceof Date)
    assert.strictEqual(user.active, false)
    assert.strictEqual(user.deletedAt, null)
    assert.strictEqual(user.role, 'user')
    assert.strictEqual(user.confirmationTokenHash, null)
    assert.strictEqual(user.confirmationTokenExpiresAt, null)
    assert.strictEqual(user.createdAt, user.updatedAt)
  })

  it('create deve aceitar role admin', () => {
    const user = User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'secret123',
      role: 'admin',
    })

    assert.strictEqual(user.role, 'admin')
  })

  it('hashToken deve gerar o hash de forma determinística em sha256', () => {
    const token = 'token-123'

    assert.strictEqual(
      User.hashToken(token),
      createHash('sha256').update(token).digest('hex'),
    )
  })

  it('setConfirmationToken deve definir hash e expiração sem ativar a conta', () => {
    const user = User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'secret123',
    })

    const expiresAt = new Date('2025-01-02T00:00:00.000Z')
    const withToken = user.setConfirmationToken('hash-do-token', expiresAt)

    assert.strictEqual(withToken.confirmationTokenHash, 'hash-do-token')
    assert.strictEqual(withToken.confirmationTokenExpiresAt, expiresAt)
    assert.strictEqual(withToken.active, false)
    assert.strictEqual(user.confirmationTokenHash, null)
  })

  it('activate deve ativar a conta e limpar o token de confirmação', () => {
    const user = User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'secret123',
    }).setConfirmationToken('hash-do-token', new Date('2025-01-02T00:00:00.000Z'))

    const activated = user.activate()

    assert.strictEqual(activated.active, true)
    assert.strictEqual(activated.confirmationTokenHash, null)
    assert.strictEqual(activated.confirmationTokenExpiresAt, null)
    assert.ok(activated.updatedAt >= user.updatedAt)
    assert.strictEqual(user.active, false)
  })

  it('isConfirmationTokenExpired deve refletir a expiração do token', () => {
    const expired = User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'secret123',
    }).setConfirmationToken('hash', new Date('2020-01-01T00:00:00.000Z'))

    const valid = User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'secret123',
    }).setConfirmationToken('hash', new Date('2030-01-01T00:00:00.000Z'))

    assert.strictEqual(expired.isConfirmationTokenExpired(new Date('2025-01-01T00:00:00.000Z')), true)
    assert.strictEqual(valid.isConfirmationTokenExpired(new Date('2025-01-01T00:00:00.000Z')), false)
  })

  it('toEntity deve preservar os dados informados', () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z')
    const updatedAt = new Date('2024-01-02T00:00:00.000Z')
    const deletedAt = new Date('2024-01-03T00:00:00.000Z')

    const user = User.toEntity({
      id: 'user-001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'secret123',
      createdAt,
      updatedAt,
      active: true,
      deletedAt,
      role: 'admin',
      confirmationTokenHash: 'hash',
      confirmationTokenExpiresAt: null,
    })

    assert.strictEqual(user.id, 'user-001')
    assert.strictEqual(user.firstName, 'John')
    assert.strictEqual(user.lastName, 'Doe')
    assert.strictEqual(user.email, 'john@example.com')
    assert.strictEqual(user.password, 'secret123')
    assert.strictEqual(user.createdAt, createdAt)
    assert.strictEqual(user.updatedAt, updatedAt)
    assert.strictEqual(user.active, true)
    assert.strictEqual(user.deletedAt, deletedAt)
    assert.strictEqual(user.role, 'admin')
    assert.strictEqual(user.confirmationTokenHash, 'hash')
    assert.strictEqual(user.confirmationTokenExpiresAt, null)
  })
})
