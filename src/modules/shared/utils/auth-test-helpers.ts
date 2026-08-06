import { nanoid } from 'nanoid'
import { drizzle } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'
import { JsonWebTokenProvider } from '@shared/auth/jsonwebtoken-provider'
import type { JwtPayload } from '@shared/auth/jwt-provider'
import { Session } from '@features/users/domain/session'
import { User } from '@features/users/domain/user'
import type { ISessionsRepository } from '@features/users/infrastructure/storage/sessions-repository'
import type { IUsersRepository } from '@features/users/infrastructure/storage/users-repository'
import * as schema from '@externals/db/schema'

export const TEST_JWT_SECRET = 'rocketseat-fastify-test-secret'

export const testJwtProvider = new JsonWebTokenProvider(TEST_JWT_SECRET)

export function makeAuthHeaders(payload: Partial<JwtPayload> = {}) {
  const fullPayload: JwtPayload = {
    sub: 'user-001',
    email: 'mock@example.com',
    jti: nanoid(),
    role: 'user',
    ...payload,
  }

  return {
    authorization: `Bearer ${testJwtProvider.sign(fullPayload)}`,
  }
}

export async function seedSession(
  sessionsRepository: ISessionsRepository,
  payload: Partial<JwtPayload> = {},
  usersRepository?: IUsersRepository,
) {
  const jti = payload.jti ?? nanoid()
  const sub = payload.sub ?? 'user-001'

  if (usersRepository) {
    const user = User.toEntity({
      id: sub,
      firstName: 'John',
      lastName: 'Doe',
      email: `auth-${sub}@example.com`,
      password: 'hash-nao-utilizado',
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true,
      deletedAt: null,
      role: payload.role ?? 'user',
      confirmationTokenHash: null,
      confirmationTokenExpiresAt: null,
    })
    await usersRepository.createUser(user)
  }

  const session = Session.create({
    userId: sub,
    jti,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  })
  await sessionsRepository.upsertByUserId(session)

  return {
    session,
    headers: makeAuthHeaders({ ...payload, jti }),
  }
}

export async function seedDbSession(
  db: ReturnType<typeof drizzle>,
  payload: Partial<JwtPayload> = {},
) {
  const sub = payload.sub ?? 'user-001'
  const jti = payload.jti ?? nanoid()
  const role = payload.role ?? 'user'

  const [existing] = await db.select().from(schema.users).where(eq(schema.users.id, sub))

  if (!existing) {
    const user = User.toEntity({
      id: sub,
      firstName: 'John',
      lastName: 'Doe',
      email: `auth-${sub}@example.com`,
      password: 'hash-nao-utilizado',
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true,
      deletedAt: null,
      role,
      confirmationTokenHash: null,
      confirmationTokenExpiresAt: null,
    })
    await db.insert(schema.users).values(user)
  }

  const session = Session.create({
    userId: sub,
    jti,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  })
  await db.insert(schema.sessions).values({
    id: session.id,
    jtiHash: session.jtiHash,
    userId: session.userId,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
  })

  return {
    userId: sub,
    headers: makeAuthHeaders({ ...payload, jti }),
  }
}
