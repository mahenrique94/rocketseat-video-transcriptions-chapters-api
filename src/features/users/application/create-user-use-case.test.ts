import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { EntityAlreadyExists } from '@shared/exceptions/index'
import type { IConfirmationTokenGenerator } from '@shared/auth/confirmation-token-generator'
import { CreateUserUseCase } from './create-user-use-case.ts'
import { UsersInMemoryRepository } from '../infrastructure/storage/users-in-memory-repository.ts'
import { User } from '../domain/user.ts'

describe('CreateUserUseCase', () => {
  let usersRepository: UsersInMemoryRepository
  let confirmationTokenGenerator: IConfirmationTokenGenerator
  let useCase: CreateUserUseCase

  beforeEach(() => {
    usersRepository = new UsersInMemoryRepository()
    confirmationTokenGenerator = {
      generate: () => 'confirmation-token-value',
    }
    useCase = new CreateUserUseCase(usersRepository, confirmationTokenGenerator)
  })

  it('deve criar e persistir um usuário inativo com token de confirmação', async () => {
    const result = await useCase.execute({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'secret123',
    })

    assert.ok(result.id)
    assert.strictEqual(result.firstName, 'John')
    assert.strictEqual(result.lastName, 'Doe')
    assert.strictEqual(result.email, 'john@example.com')
    assert.ok(result.createdAt instanceof Date)
    assert.ok(result.updatedAt instanceof Date)
    assert.strictEqual(result.active, false)
    assert.strictEqual(result.role, 'user')
    assert.strictEqual(result.confirmationToken, 'confirmation-token-value')
    assert.ok(!('password' in result))

    const stored = await usersRepository.findById(result.id)
    assert.ok(stored)
    assert.strictEqual(stored.active, false)
    assert.strictEqual(stored.confirmationTokenHash, User.hashToken('confirmation-token-value'))
    assert.ok(stored.confirmationTokenExpiresAt instanceof Date)
    assert.strictEqual(stored.isConfirmationTokenExpired(), false)
  })

  it('deve lançar EntityAlreadyExists quando o e-mail já está em uso', async () => {
    await useCase.execute({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'secret123',
    })

    await assert.rejects(
      useCase.execute({
        firstName: 'Jane',
        lastName: 'Roe',
        email: 'john@example.com',
        password: 'secret123',
      }),
      (error) => {
        assert.ok(error instanceof EntityAlreadyExists)
        assert.strictEqual(error.message, 'Já existe um usuário com este e-mail')
        return true
      },
    )
  })
})
