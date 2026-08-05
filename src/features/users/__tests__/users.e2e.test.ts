import { describe, it, before, after, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'
import * as schema from '@shared/db/schema'

const e2eDbUrl =
  process.env.E2E_DATABASE_URL ||
  process.env.DATABASE_URL

const dbAvailable = !!e2eDbUrl

let pool: pg.Pool | undefined
let testDb: ReturnType<typeof drizzle> | undefined

if (dbAvailable) {
  pool = new pg.Pool({ connectionString: e2eDbUrl })
  testDb = drizzle(pool, { schema })

  mock.module('@shared/db/index', {
    exports: { default: testDb },
  })
}

mock.module('@features/chapters/infrastructure/ai/mastra', {
  exports: {
    chaptersMastra: {
      getAgentById: () => ({ generate: async () => ({ text: '' }) }),
    },
  },
})

mock.module('@features/transcriptions/infrastructure/ai/mastra', {
  exports: {
    transcriptionsMastra: {
      getAgentById: () => ({ generate: async () => ({ text: '' }) }),
    },
  },
})

const suppressConsole = mock.method(console, 'error', () => {})
after(() => suppressConsole.mock.restore())

const { buildApp } = await import('../../../app.ts')

const createdEmails = new Set<string>()

describe('E2E - /api/v1/auth/sign-up', { skip: !dbAvailable ? 'DATABASE_URL not configured' : false }, () => {
  if (!dbAvailable) return

  let app: ReturnType<typeof buildApp>

  before(async () => {
    app = buildApp()
    await app.ready()
  })

  after(async () => {
    await app.close()
    if (pool) await pool.end()
  })

  afterEach(async () => {
    if (testDb) {
      for (const email of createdEmails) {
        await testDb.delete(schema.users).where(eq(schema.users.email, email))
      }
      createdEmails.clear()
    }
  })

  it('POST /api/v1/auth/sign-up - deve criar usuário com dados informados', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/sign-up',
      body: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'secret123',
        confirmPassword: 'secret123',
      },
    })

    assert.strictEqual(response.statusCode, 201)
    const body = response.json()
    assert.ok(body.id)
    assert.strictEqual(body.firstName, 'John')
    assert.strictEqual(body.lastName, 'Doe')
    assert.strictEqual(body.email, 'john@example.com')
    assert.strictEqual(body.active, true)
    assert.ok(body.createdAt)
    assert.ok(body.updatedAt)
    assert.ok(!('password' in body))
    createdEmails.add('john@example.com')
  })

  it('POST /api/v1/auth/sign-up - deve retornar 409 quando o e-mail já está em uso', async () => {
    const email = 'duplicate@example.com'
    createdEmails.add(email)

    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/sign-up',
      body: {
        firstName: 'John',
        lastName: 'Doe',
        email,
        password: 'secret123',
        confirmPassword: 'secret123',
      },
    })

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/sign-up',
      body: {
        firstName: 'Jane',
        lastName: 'Roe',
        email,
        password: 'secret123',
        confirmPassword: 'secret123',
      },
    })

    assert.strictEqual(response.statusCode, 409)
    assert.strictEqual(response.json().message, 'Já existe um usuário com este e-mail')
  })

  it('POST /api/v1/auth/sign-up - deve retornar 400 quando as senhas não conferem', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/sign-up',
      body: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'secret123',
        confirmPassword: 'outra-senha',
      },
    })

    assert.strictEqual(response.statusCode, 400)
    assert.strictEqual(response.json().message, 'Validation error')
  })

  it('POST /api/v1/auth/sign-up - deve retornar 400 para corpo vazio', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/sign-up',
      body: {},
    })

    assert.strictEqual(response.statusCode, 400)
    assert.strictEqual(response.json().message, 'Validation error')
  })

  async function signUp(email: string) {
    createdEmails.add(email)
    return app.inject({
      method: 'POST',
      url: '/api/v1/auth/sign-up',
      body: {
        firstName: 'John',
        lastName: 'Doe',
        email,
        password: 'secret123',
        confirmPassword: 'secret123',
      },
    })
  }

  it('POST /api/v1/auth/sign-in - deve autenticar com e-mail e senha corretos', async () => {
    await signUp('signin@example.com')

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/sign-in',
      body: {
        email: 'signin@example.com',
        password: 'secret123',
      },
    })

    assert.strictEqual(response.statusCode, 200)
    const body = response.json()
    assert.ok(body.token)
    assert.strictEqual(typeof body.token, 'string')
    assert.ok(body.refreshToken)
    assert.strictEqual(typeof body.refreshToken, 'string')
    assert.ok(!('password' in body))
  })

  it('POST /api/v1/auth/sign-in - deve retornar 403 para e-mail inexistente', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/sign-in',
      body: {
        email: 'nao-existe@example.com',
        password: 'secret123',
      },
    })

    assert.strictEqual(response.statusCode, 403)
    assert.strictEqual(response.json().message, 'Email ou senha inválidos')
  })

  it('POST /api/v1/auth/sign-in - deve retornar 403 para senha incorreta', async () => {
    await signUp('senha-errada@example.com')

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/sign-in',
      body: {
        email: 'senha-errada@example.com',
        password: 'senha-errada',
      },
    })

    assert.strictEqual(response.statusCode, 403)
    assert.strictEqual(response.json().message, 'Email ou senha inválidos')
  })

  it('POST /api/v1/auth/sign-in - deve retornar 400 para corpo vazio', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/sign-in',
      body: {},
    })

    assert.strictEqual(response.statusCode, 400)
    assert.strictEqual(response.json().message, 'Validation error')
  })

  describe('POST /api/v1/auth/refresh-token', () => {
    async function signIn() {
      const email = 'refresh@example.com'
      await signUp(email)
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/sign-in',
        body: {
          email,
          password: 'secret123',
        },
      })
      return response.json() as { token: string; refreshToken: string }
    }

    it('deve renovar o token de acesso com um refresh token válido', async () => {
      const { refreshToken } = await signIn()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh-token',
        body: { refreshToken },
      })

      assert.strictEqual(response.statusCode, 200)
      const body = response.json()
      assert.ok(body.token)
      assert.ok(body.refreshToken)
      assert.notStrictEqual(body.refreshToken, refreshToken)
    })

    it('deve retornar 403 ao reutilizar um refresh token já rotacionado', async () => {
      const { refreshToken } = await signIn()

      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh-token',
        body: { refreshToken },
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh-token',
        body: { refreshToken },
      })

      assert.strictEqual(response.statusCode, 403)
      assert.strictEqual(response.json().message, 'Refresh token inválido ou expirado')
    })

    it('deve retornar 403 para um refresh token inválido', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh-token',
        body: { refreshToken: 'token-invalido' },
      })

      assert.strictEqual(response.statusCode, 403)
      assert.strictEqual(response.json().message, 'Refresh token inválido ou expirado')
    })

    it('deve retornar 400 para corpo vazio', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh-token',
        body: {},
      })

      assert.strictEqual(response.statusCode, 400)
      assert.strictEqual(response.json().message, 'Validation error')
    })
  })

  describe('Sessão única por usuário', () => {
    async function signIn(email: string) {
      await signUp(email)
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/sign-in',
        body: {
          email,
          password: 'secret123',
        },
      })
      return response.json() as { token: string; refreshToken: string }
    }

    it('deve invalidar o token anterior quando o usuário faz novo login', async () => {
      const first = await signIn('single-session@example.com')
      const second = await signIn('single-session@example.com')

      const firstResponse = await app.inject({
        method: 'GET',
        url: '/api/v2/videos',
        headers: { authorization: `Bearer ${first.token}` },
      })
      const secondResponse = await app.inject({
        method: 'GET',
        url: '/api/v2/videos',
        headers: { authorization: `Bearer ${second.token}` },
      })

      assert.strictEqual(firstResponse.statusCode, 401)
      assert.strictEqual(firstResponse.json().message, 'Sessão inválida ou expirada')
      assert.strictEqual(secondResponse.statusCode, 200)
    })
  })

  describe('POST /api/v1/auth/sign-out', () => {
    async function signIn(email: string) {
      await signUp(email)
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/sign-in',
        body: {
          email,
          password: 'secret123',
        },
      })
      return response.json() as { token: string; refreshToken: string }
    }

    it('deve encerrar a sessão e invalidar o token de acesso', async () => {
      const { token } = await signIn('sign-out@example.com')

      const signOutResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/sign-out',
        headers: { authorization: `Bearer ${token}` },
      })

      assert.strictEqual(signOutResponse.statusCode, 200)
      assert.deepStrictEqual(signOutResponse.json(), { message: 'Sessão encerrada com sucesso' })

      const afterResponse = await app.inject({
        method: 'GET',
        url: '/api/v2/videos',
        headers: { authorization: `Bearer ${token}` },
      })

      assert.strictEqual(afterResponse.statusCode, 401)
      assert.strictEqual(afterResponse.json().message, 'Sessão inválida ou expirada')
    })

    it('deve invalidar os refresh tokens do usuário ao encerrar a sessão', async () => {
      const { token, refreshToken } = await signIn('sign-out-refresh@example.com')

      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/sign-out',
        headers: { authorization: `Bearer ${token}` },
      })

      const refreshResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh-token',
        body: { refreshToken },
      })

      assert.strictEqual(refreshResponse.statusCode, 403)
      assert.strictEqual(refreshResponse.json().message, 'Refresh token inválido ou expirado')
    })

    it('deve retornar 401 sem token de autenticação', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/sign-out',
      })

      assert.strictEqual(response.statusCode, 401)
      assert.strictEqual(response.json().message, 'Token de autenticação não informado')
    })
  })
})
