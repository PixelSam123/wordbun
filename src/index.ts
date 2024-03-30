import type { Server, ServerWebSocket } from 'bun'
import { createLogger, format, transports } from 'winston'

const logger = createLogger({
  format: format.cli(),
  transports: [new transports.Console()],
})

type PublicRoom = {
  room_id: string
  player_count: number
  current_dictionary: string | null
}

type PathnameToHandler = {
  [pathname: string]:
    | ((req: Request, server: Server) => Response | undefined)
    | undefined
}

function handleAnagram() {
  const placeholderPublicRooms: PublicRoom[] = [
    {
      room_id: 'eh',
      player_count: 5,
      current_dictionary: 'aa',
    },
    {
      room_id: 'lol',
      player_count: 6,
      current_dictionary: 'aa',
    },
  ]

  return Response.json(placeholderPublicRooms)
}

function handleWsAnagram(req: Request, server: Server) {
  if (server.upgrade(req)) {
    return
  }

  return new Response('Upgrade failed', { status: 500 })
}

function handleWsOnOpen(ws: ServerWebSocket) {}

function handleWsOnMessage(ws: ServerWebSocket, message: string | Buffer) {}

function handleWsOnClose(ws: ServerWebSocket, code: number, reason: string) {}

const server = Bun.serve({
  fetch(req, server) {
    const pathnameToHandler: PathnameToHandler = {
      '/anagram': handleAnagram,
      '/ws/anagram': handleWsAnagram,
    }

    const handler = pathnameToHandler[new URL(req.url).pathname]

    if (typeof handler === 'undefined') {
      return new Response('404 Not Found', { status: 404 })
    }

    return handler(req, server)
  },
  websocket: {
    open: handleWsOnOpen,
    message: handleWsOnMessage,
    close: handleWsOnClose,
  },
})

logger.info(`Bun.serve() listening on ${server.url}`)
