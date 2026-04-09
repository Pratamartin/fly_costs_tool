import { configureDocs, createApp } from './lib/config'
import { registerRoutes } from './lib/util'
import { health } from './routes'

const app = createApp()

const v1 = createApp()

registerRoutes(v1, [health])

app.route('/v1', v1)

configureDocs(app)

export type v1Routes = typeof v1

export default app
