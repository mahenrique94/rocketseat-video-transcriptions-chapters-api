import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'

import { config } from '@shared/config/index'

const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: 1,
})

try {
  const db = drizzle(pool)
  await migrate(db, { migrationsFolder: 'drizzle' })
  console.log('Migrations applied successfully')
} finally {
  await pool.end()
}
