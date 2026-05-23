export const boss = {
  start: async () => {},
  stop: async () => {},
  send: async () => {},
  work: async () => {},
  createQueue: async () => {},
}

export class BaseJob {
  async start() {}
  async emit() {}
}

export class JobManager {
  register() { return this }
  async start() {}
  async stop() {}
  async emit() {}
}
