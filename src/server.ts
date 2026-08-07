import { buildApp } from './app.ts'

const app = buildApp({ enableVideoProcessingWorker: true })

app.listen({ port: 3333 }).then(() => {
  console.log('Server running on http://localhost:3333')
})
