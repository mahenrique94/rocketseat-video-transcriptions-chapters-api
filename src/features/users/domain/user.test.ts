import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { User } from './user.ts'

describe('User', () => {
  it('create deve retornar entidade com id gerado, ativa e sem deletedAt', () => {
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
    assert.strictEqual(user.active, true)
    assert.strictEqual(user.deletedAt, null)
    assert.strictEqual(user.role, 'user')
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
  })
})
