import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { EntityAlreadyExists } from '@shared/exceptions/index'
import { CreateUserUseCase } from './create-user-use-case.ts'
import { UsersInMemoryRepository } from '../infrastructure/storage/users-in-memory-repository.ts'

describe('CreateUserUseCase', () => {
  let usersRepository: UsersInMemoryRepository
  let useCase: CreateUserUseCase

  beforeEach(() => {
    usersRepository = new UsersInMemoryRepository()
    useCase = new CreateUserUseCase(usersRepository)
  })

  it('deve criar e persistir um usuário', async () => {
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
    assert.strictEqual(result.active, true)
    assert.strictEqual(result.role, 'user')
    assert.ok(!('password' in result))
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
