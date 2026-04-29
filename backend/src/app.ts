import { configureDocs, createApp } from './lib/config'
import { createRouter, registerRoutes } from './lib/util'
import { auth, expenses, health, me, projects } from './routes'

const app = createApp()

const v1 = createRouter()

registerRoutes(v1, [
  health,
  auth,
  me,
  expenses,
  projects,
])

app.route('/v1', v1)

configureDocs(app)

export type v1Routes = typeof v1

export default app
