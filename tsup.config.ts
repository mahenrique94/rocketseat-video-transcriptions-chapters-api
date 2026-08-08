import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts', 'src/modules/shared/db/migrate.ts'],
  format: ['esm'],
  target: 'node24',
  clean: true,
  sourcemap: true,
  splitting: false,
  skipNodeModulesBundle: true,
})
