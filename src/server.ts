import { buildApp } from './app.ts'

const app = buildApp()

app.listen({ port: 3333 }).then(() => {
  console.log('Server running on http://localhost:3333')
})
