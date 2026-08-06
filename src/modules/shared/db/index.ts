import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

import { config } from '@shared/config/index'
import * as schema from '@externals/db/schema'

const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
})

const db = drizzle(pool, { schema })

export default db

export type DbClient = typeof db
