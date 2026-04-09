import { testClient } from 'hono/testing'
import { describe, expect, it } from 'vitest'
import env from '@/env'
import { createTestApp } from '@/lib/config'
import { health } from '@/routes'

if (env.NODE_ENV !== 'test') {
  throw new Error('NODE_ENV must be \'test\'')
}

const client = testClient(createTestApp(health))

describe('health routes', () => {
  it('get /health checks api health', async () => {
    const response = await client.health.$get()
    expect(response.status).toBe(200)
    if (response.status === 200) {
      const json = await response.json()
      expect(json.status).toBe('OK')
      expect(typeof json.uptime).toBe('number')
      expect(json.timestamp).toBeDefined()
    }
  })
})
