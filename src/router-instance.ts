import { publicRoom } from './response-factories'
import { Router } from './router'

const router = new Router()

router.add('/anagram', () => {
  return Response.json(
    Array.from(idToRoom.entries())
      .filter(([roomId]) => !roomId.startsWith('private'))
      .map(([roomId, room]) =>
        publicRoom({
          roomId,
          playerCount: room.playerCount,
          currentDictionary: null,
        }),
      ),
  )
})

router.add('/ws/anagram', ({ req, server, trailingPath }) => {
  const roomId = trailingPath.slice(1).trim()
  if (!roomId) {
    return new Response('Room ID is required', { status: 400 })
  }

  if (server.upgrade(req, { data: { roomId } })) {
    return
  }

  return new Response('Upgrade failed', { status: 500 })
})

export { router }
