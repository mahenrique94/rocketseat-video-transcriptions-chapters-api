import { z } from 'zod'
import type { AppConfig } from './types.ts'

export const testEnvSchema = z.object({
  DATABASE_URL: z.string().optional(),
  E2E_DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().default('test-secret'),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(30),
  CONFIRMATION_TOKEN_EXPIRES_IN_HOURS: z.coerce.number().int().positive().default(24),
})

export function loadConfig(
  source: Record<string, string | undefined> = process.env,
): Omit<AppConfig, 'NODE_ENV'> {
  return testEnvSchema.parse(source)
}
