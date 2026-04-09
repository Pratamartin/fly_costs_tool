import type { Schema } from 'hono/types'
import type { AppOpenAPI } from './type'
import { Scalar } from '@scalar/hono-api-reference'
import { requestId } from 'hono/request-id'
import { notFound, onError } from 'stoker/middlewares'
import { cors, logger } from '@/middlewares'
import packageJSON from '../../package.json' with { type: 'json' }
import { createRouter } from './util'

export function createApp() {
  const app = createRouter()

  app.use(cors)
    .use(requestId())
    .use(logger)

  app.notFound(notFound)
  app.onError(onError)

  return app
}

export function createTestApp<S extends Schema>(router: AppOpenAPI<S>) {
  return createApp().route('/', router)
}

export function configureDocs(app: AppOpenAPI) {
  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      version: packageJSON.version,
      title: 'Fly Costs API',
    },
  })

  app.get('/reference', Scalar({
    url: `/doc`,
    pageTitle: 'Fly Costs API Reference',
    layout: 'classic',
    theme: 'kepler',
    defaultHttpClient: {
      targetKey: 'js',
      clientKey: 'axios',
    },
  }))
}
