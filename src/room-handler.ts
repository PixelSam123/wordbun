import { server } from '.'
import { logger } from './logger'
import { chatMessage } from './message-factories'
import type { RoomHandlers } from './room'

export const roomHandler: RoomHandlers = {
  onFirstPlayerAdded(room) {
    idToRoom.set(room.id, room)
    logger.info(`(room count: ${idToRoom.size}) Room added  : ${room.id}`)
  },

  onLastPlayerRemoved(room) {
    idToRoom.delete(room.id)
    logger.info(`(room count: ${idToRoom.size}) Room removed: ${room.id}`)
  },

  onPlayerAdded(room, username) {
    server.publish(room.id, chatMessage(`${username} joined!`))
  },

  onPlayerRemoved(room, username) {
    server.publish(room.id, chatMessage(`${username} left!`))
  },
}
