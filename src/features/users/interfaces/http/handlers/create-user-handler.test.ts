import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateUserUseCase } from '../../../application/create-user-use-case'
import { CreateUserHandler } from './create-user-handler.ts'
import { CreateUserDTO } from '../../../application/dto/create-user.dto'
import { ReturnUserDTO } from '../../../application/dto/return-user.dto'
import { EntityAlreadyExists } from '@shared/exceptions/index'

interface MockReply {
  statusCode: number
  sent: unknown
  status(code: number): MockReply
  send(payload: unknown): MockReply
}

function createMockReply(): MockReply {
  let statusCode = 200
  let sent: unknown
  const reply: MockReply = {
    get statusCode() {
      return statusCode
    },
    get sent() {
      return sent
    },
    status(code: number) {
      statusCode = code
      return reply
    },
    send(payload: unknown) {
      sent = payload
      return reply
    },
  }
  return reply
}

function makeUseCase(overrides: {
  result?: unknown
  error?: unknown
  onExecute?: (input: CreateUserDTO) => void
} = {}) {
  const calls: CreateUserDTO[] = []
  return {
    calls,
    execute: async (input: CreateUserDTO) => {
      calls.push(input)
      overrides.onExecute?.(input)
      if (overrides.error) throw overrides.error
      return overrides.result
    },
  }
}

describe('CreateUserHandler', () => {
  it('deve responder 201 com o usuário criado', async () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z')
    const useCase = makeUseCase({
      result: new ReturnUserDTO(
        'user-001',
        'John',
        'Doe',
        'john@example.com',
        createdAt,
        createdAt,
        false,
        'user',
        'confirmation-token-value',
      ),
    })
    const handler = new CreateUserHandler(useCase as unknown as CreateUserUseCase)
    const reply = createMockReply()
    const request = {
      body: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'secret123',
        confirmPassword: 'secret123',
      },
    } as unknown as FastifyRequest

    await handler.execute(request, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 201)
    const sent = reply.sent as ReturnUserDTO
    assert.strictEqual(sent.id, 'user-001')
    assert.strictEqual(sent.firstName, 'John')
    assert.strictEqual(sent.lastName, 'Doe')
    assert.strictEqual(sent.email, 'john@example.com')
    assert.strictEqual(sent.role, 'user')
    assert.strictEqual(sent.confirmationToken, 'confirmation-token-value')
    assert.ok(useCase.calls[0] instanceof CreateUserDTO)
    assert.strictEqual(useCase.calls[0].password, 'secret123')
  })

  it('deve responder 409 quando o e-mail já está em uso', async () => {
    const useCase = makeUseCase({ error: new EntityAlreadyExists('Já existe um usuário com este e-mail') })
    const handler = new CreateUserHandler(useCase as unknown as CreateUserUseCase)
    const reply = createMockReply()
    const request = {
      body: {
        firstName: 'Jane',
        lastName: 'Roe',
        email: 'john@example.com',
        password: 'secret123',
        confirmPassword: 'secret123',
      },
    } as unknown as FastifyRequest

    await handler.execute(request, reply as unknown as FastifyReply)

    assert.strictEqual(reply.statusCode, 409)
    assert.deepStrictEqual(reply.sent, { message: 'Já existe um usuário com este e-mail' })
  })

  it('deve relançar erros não mapeados', async () => {
    const useCase = makeUseCase({ error: new Error('erro inesperado') })
    const handler = new CreateUserHandler(useCase as unknown as CreateUserUseCase)
    const reply = createMockReply()

    await assert.rejects(
      handler.execute(
        {
          body: {
            firstName: 'Jane',
            lastName: 'Roe',
            email: 'jane@example.com',
            password: 'secret123',
            confirmPassword: 'secret123',
          },
        } as unknown as FastifyRequest,
        reply as unknown as FastifyReply,
      ),
      /erro inesperado/,
    )
  })
})
