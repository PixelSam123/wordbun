import { logger } from './logger'
import { router } from './router-instance'
import {
  handleWsOnClose,
  handleWsOnMessage,
  handleWsOnOpen,
} from './ws-handlers'

const server = Bun.serve({
  fetch(req, server) {
    return router.handle(req, server)
  },
  websocket: {
    open: handleWsOnOpen,
    message: handleWsOnMessage,
    close: handleWsOnClose,
  },
})

logger.info(`Bun.serve() listening on ${server.url}`)
