import { config } from '@shared/config/index'
import type { ConnectionOptions } from 'bullmq'

export function getRedisConnectionOptions(url = config.REDIS_URL ?? 'redis://localhost:6379'): ConnectionOptions {
  const parsed = new URL(url)

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db: parsed.pathname && parsed.pathname !== '/' ? Number(parsed.pathname.slice(1)) : 0,
    ...(parsed.protocol === 'rediss:' ? { tls: {} } : {}),
  }
}
