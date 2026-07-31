import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { DrizzleQueryError } from 'drizzle-orm/errors'
import { DatabaseError } from 'pg'
import { isDbError, getDbError } from './db-errors.ts'

describe('isDbError', () => {
  it('deve retornar true para DrizzleQueryError', () => {
    const error = new DrizzleQueryError('SELECT 1', [], undefined)
    assert.strictEqual(isDbError(error), true)
  })

  it('deve retornar false para Error comum', () => {
    assert.strictEqual(isDbError(new Error('erro comum')), false)
  })

  it('deve retornar false para string', () => {
    assert.strictEqual(isDbError('erro'), false)
  })

  it('deve retornar false para null', () => {
    assert.strictEqual(isDbError(null), false)
  })

  it('deve retornar false para undefined', () => {
    assert.strictEqual(isDbError(undefined), false)
  })
})

describe('getDbError', () => {
  function makeDrizzleError(code: string, detail?: string) {
    const pgError = new DatabaseError('database error', 0, 'error')
    pgError.code = code
    pgError.detail = detail
    return new DrizzleQueryError('SELECT 1', [], pgError)
  }

  it('deve mapear código 23505 para 409 - Registro duplicado', () => {
    const result = getDbError(makeDrizzleError('23505', 'Key (id) already exists'))
    assert.strictEqual(result.status, 409)
    assert.strictEqual(result.message, 'Registro duplicado')
    assert.strictEqual(result.detail, 'Key (id) already exists')
  })

  it('deve mapear código 23503 para 400 - Violação de chave estrangeira', () => {
    const result = getDbError(makeDrizzleError('23503'))
    assert.strictEqual(result.status, 400)
    assert.strictEqual(result.message, 'Violação de chave estrangeira')
  })

  it('deve mapear código 23502 para 400 - Campo obrigatório não pode ser nulo', () => {
    const result = getDbError(makeDrizzleError('23502'))
    assert.strictEqual(result.status, 400)
    assert.strictEqual(result.message, 'Campo obrigatório não pode ser nulo')
  })

  it('deve mapear código 08006 para 503 - Falha na conexão', () => {
    const result = getDbError(makeDrizzleError('08006'))
    assert.strictEqual(result.status, 503)
    assert.strictEqual(result.message, 'Falha na conexão com o banco de dados')
  })

  it('deve retornar 500 para código desconhecido', () => {
    const result = getDbError(makeDrizzleError('XXXXX'))
    assert.strictEqual(result.status, 500)
    assert.strictEqual(result.message, 'Erro interno do servidor')
  })

  it('deve retornar 500 quando não há cause', () => {
    const error = new DrizzleQueryError('SELECT 1', [], undefined)
    const result = getDbError(error)
    assert.strictEqual(result.status, 500)
    assert.strictEqual(result.message, 'Erro interno do servidor')
  })

  it('deve retornar 500 quando cause não é DatabaseError', () => {
    const error = new DrizzleQueryError('SELECT 1', [], new Error('generic'))
    const result = getDbError(error)
    assert.strictEqual(result.status, 500)
    assert.strictEqual(result.message, 'Erro interno do servidor')
  })
})
