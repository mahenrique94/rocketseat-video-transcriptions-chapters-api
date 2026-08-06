import { z } from 'zod'
import type { AppConfig } from './types.ts'

export const productionEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(30),
  CONFIRMATION_TOKEN_EXPIRES_IN_HOURS: z.coerce.number().int().positive().default(24),
})

export function loadConfig(
  source: Record<string, string | undefined> = process.env,
): Omit<AppConfig, 'NODE_ENV'> {
  return productionEnvSchema.parse(source)
}
