import { logger } from './logger'
import { router } from './router-instance'
import { wsHandler } from './ws-handler'

const server = Bun.serve({
  fetch(req, server) {
    return router.handle(req, server)
  },
  websocket: wsHandler,
})

logger.info(`Bun.serve() listening on ${server.url}`)
