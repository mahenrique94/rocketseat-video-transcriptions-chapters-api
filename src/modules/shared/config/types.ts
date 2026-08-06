import { z } from 'zod'

export const nodeEnvSchema = z.enum(['development', 'production', 'test'])

export type NodeEnv = z.infer<typeof nodeEnvSchema>

export interface AppConfig {
  NODE_ENV: NodeEnv
  DATABASE_URL?: string
  E2E_DATABASE_URL?: string
  JWT_SECRET: string
  JWT_ACCESS_TOKEN_EXPIRES_IN: string
  REFRESH_TOKEN_EXPIRES_IN_DAYS: number
  CONFIRMATION_TOKEN_EXPIRES_IN_HOURS: number
}
