import { logger } from './logger'
import { router } from './router-instance'
import { wsHandler } from './ws-handler'

// globalThis assignments are for taking advantage of
// Bun's hot-reloading feature
globalThis.idToRoom ??= new Map()

export const server = Bun.serve({
  fetch(req, server) {
    return router.handle(req, server)
  },
  websocket: wsHandler,
})

logger.info(`Bun.serve() listening on ${server.url}`)
