import type { ServerWebSocket } from 'bun'

export function handleWsOnOpen(ws: ServerWebSocket) {}

export function handleWsOnMessage(
  ws: ServerWebSocket,
  message: string | Buffer,
) {}

export function handleWsOnClose(
  ws: ServerWebSocket,
  code: number,
  reason: string,
) {}
