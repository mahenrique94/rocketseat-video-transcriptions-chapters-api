import { Redis } from 'ioredis'

import { config } from '@shared/config/index'

export const redis = new Redis(config.REDIS_URL ?? 'redis://localhost:6379', {
  lazyConnect: config.NODE_ENV === 'test',
})

export default redis

export type RedisClient = Redis
