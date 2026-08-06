import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { developmentEnvSchema } from './development.ts'
import { productionEnvSchema } from './production.ts'
import { testEnvSchema } from './test.ts'

describe('config', () => {
  describe('development', () => {
    it('usa valores padrão para envs opcionais', () => {
      const result = developmentEnvSchema.parse({
        DATABASE_URL: 'postgresql://root:root@localhost:5432/rocketseat_fastify',
      })

      assert.strictEqual(result.DATABASE_URL, 'postgresql://root:root@localhost:5432/rocketseat_fastify')
      assert.strictEqual(result.JWT_SECRET, 'rocketseat-fastify-dev-secret')
      assert.strictEqual(result.JWT_ACCESS_TOKEN_EXPIRES_IN, '15m')
      assert.strictEqual(result.REFRESH_TOKEN_EXPIRES_IN_DAYS, 30)
      assert.strictEqual(result.CONFIRMATION_TOKEN_EXPIRES_IN_HOURS, 24)
    })

    it('aceita valores informados para envs opcionais', () => {
      const result = developmentEnvSchema.parse({
        DATABASE_URL: 'postgresql://root:root@localhost:5432/rocketseat_fastify',
        JWT_SECRET: 'segredo',
        JWT_ACCESS_TOKEN_EXPIRES_IN: '30m',
        REFRESH_TOKEN_EXPIRES_IN_DAYS: '60',
        CONFIRMATION_TOKEN_EXPIRES_IN_HOURS: '48',
      })

      assert.strictEqual(result.JWT_SECRET, 'segredo')
      assert.strictEqual(result.JWT_ACCESS_TOKEN_EXPIRES_IN, '30m')
      assert.strictEqual(result.REFRESH_TOKEN_EXPIRES_IN_DAYS, 60)
      assert.strictEqual(result.CONFIRMATION_TOKEN_EXPIRES_IN_HOURS, 48)
    })

    it('exige DATABASE_URL', () => {
      assert.throws(() => developmentEnvSchema.parse({}))
    })
  })

  describe('production', () => {
    it('exige DATABASE_URL, JWT_SECRET e OPENAI_API_KEY', () => {
      assert.throws(() => productionEnvSchema.parse({ DATABASE_URL: 'x', JWT_SECRET: 'x' }))
      assert.throws(() => productionEnvSchema.parse({ DATABASE_URL: 'x', OPENAI_API_KEY: 'k' }))
      assert.throws(() => productionEnvSchema.parse({ JWT_SECRET: 'x', OPENAI_API_KEY: 'k' }))
    })

    it('não possui default para o JWT_SECRET', () => {
      const result = productionEnvSchema.parse({
        DATABASE_URL: 'postgresql://db',
        JWT_SECRET: 'segredo-prod',
        OPENAI_API_KEY: 'chave',
      })

      assert.strictEqual(result.JWT_SECRET, 'segredo-prod')
    })
  })

  describe('test', () => {
    it('permite DATABASE_URL ausente e usa default do JWT_SECRET', () => {
      const result = testEnvSchema.parse({})

      assert.strictEqual(result.DATABASE_URL, undefined)
      assert.strictEqual(result.E2E_DATABASE_URL, undefined)
      assert.strictEqual(result.JWT_SECRET, 'test-secret')
      assert.strictEqual(result.REFRESH_TOKEN_EXPIRES_IN_DAYS, 30)
      assert.strictEqual(result.CONFIRMATION_TOKEN_EXPIRES_IN_HOURS, 24)
    })

    it('mantém DATABASE_URL e E2E_DATABASE_URL quando informados', () => {
      const result = testEnvSchema.parse({
        DATABASE_URL: 'postgresql://test',
        E2E_DATABASE_URL: 'postgresql://e2e',
      })

      assert.strictEqual(result.DATABASE_URL, 'postgresql://test')
      assert.strictEqual(result.E2E_DATABASE_URL, 'postgresql://e2e')
    })
  })
})
