import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { InvalidConfirmationToken } from '@shared/exceptions/index'
import { ConfirmAccountUseCase } from './confirm-account-use-case.ts'
import { UsersInMemoryRepository } from '../infrastructure/storage/users-in-memory-repository.ts'
import { User } from '../domain/user.ts'

describe('ConfirmAccountUseCase', () => {
  let usersRepository: UsersInMemoryRepository
  let useCase: ConfirmAccountUseCase

  beforeEach(() => {
    usersRepository = new UsersInMemoryRepository()
    useCase = new ConfirmAccountUseCase(usersRepository)
  })

  async function seedUserWithToken(token: string, expiresAt?: Date) {
    const user = User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'secret123',
    }).setConfirmationToken(User.hashToken(token), expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000))
    await usersRepository.createUser(user)
    return user
  }

  it('deve ativar a conta quando o token é válido', async () => {
    const user = await seedUserWithToken('token-valido')

    await useCase.execute({ token: 'token-valido' })

    const stored = await usersRepository.findById(user.id)
    assert.ok(stored)
    assert.strictEqual(stored.active, true)
    assert.strictEqual(stored.confirmationTokenHash, null)
    assert.strictEqual(stored.confirmationTokenExpiresAt, null)
  })

  it('deve lançar InvalidConfirmationToken quando o token não existe', async () => {
    await assert.rejects(
      useCase.execute({ token: 'token-inexistente' }),
      (error) => {
        assert.ok(error instanceof InvalidConfirmationToken)
        assert.strictEqual(error.message, 'Token de confirmação inválido ou expirado')
        return true
      },
    )
  })

  it('deve lançar InvalidConfirmationToken quando o token está expirado', async () => {
    await seedUserWithToken('token-expirado', new Date(Date.now() - 1000))

    await assert.rejects(
      useCase.execute({ token: 'token-expirado' }),
      (error) => {
        assert.ok(error instanceof InvalidConfirmationToken)
        assert.strictEqual(error.message, 'Token de confirmação inválido ou expirado')
        return true
      },
    )
  })

  it('deve lançar InvalidConfirmationToken ao reutilizar um token já confirmado', async () => {
    const user = await seedUserWithToken('token-unico')
    await useCase.execute({ token: 'token-unico' })

    const stored = await usersRepository.findById(user.id)
    assert.ok(stored)
    assert.strictEqual(stored.active, true)

    await assert.rejects(
      useCase.execute({ token: 'token-unico' }),
      (error) => {
        assert.ok(error instanceof InvalidConfirmationToken)
        return true
      },
    )
  })
})
