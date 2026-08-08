import { buildApp } from './app.ts'

const app = buildApp({ enableVideoProcessingWorker: true })

const port = Number(process.env.PORT ?? 3333)
const host = process.env.HOST ?? '0.0.0.0'

app.listen({ port, host }).then(() => {
  console.log(`Server running on http://${host}:${port}`)
})
