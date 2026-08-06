import { nodeEnvSchema } from './types.ts'
import type { AppConfig, NodeEnv } from './types.ts'
import { loadConfig as loadDevelopmentConfig } from './development.ts'
import { loadConfig as loadProductionConfig } from './production.ts'
import { loadConfig as loadTestConfig } from './test.ts'

const loaders: Record<NodeEnv, () => Omit<AppConfig, 'NODE_ENV'>> = {
  development: loadDevelopmentConfig,
  production: loadProductionConfig,
  test: loadTestConfig,
}

const nodeEnv = nodeEnvSchema.catch('development').parse(process.env.NODE_ENV)

export const config: AppConfig = {
  ...loaders[nodeEnv](),
  NODE_ENV: nodeEnv,
}

export default config
export type { AppConfig, NodeEnv }
export { nodeEnvSchema }
