import type { WebSocketHandler } from 'bun'

export const wsHandler: WebSocketHandler = {
  open(ws) {},
  message(ws, message) {},
  close(ws, code, reason) {},
}
