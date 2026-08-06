import dotenv from "dotenv";
import { defineConfig } from 'drizzle-kit'

dotenv.config({
  path: [
    ".env.development.local",
    ".env.development",
    ".env.local",
    ".env"
  ]
})

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/externals/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
