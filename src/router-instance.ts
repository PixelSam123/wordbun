import { Router } from './router'

type PublicRoom = {
  room_id: string
  player_count: number
  current_dictionary: string | null
}

const router = new Router()

router.add('/anagram', () => {
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
})
router.add('/ws/anagram', ({ req, server }) => {
  if (server.upgrade(req)) {
    return
  }

  return new Response('Upgrade failed', { status: 500 })
})

export { router }
