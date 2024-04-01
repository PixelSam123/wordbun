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

  onGameStart(room, gameConfig) {
    let message = 'Starting new game! Settings:\n'
    message += `Dictionary: ${gameConfig.dictionary}\n`
    message += `Round Count: ${gameConfig.roundCount}\n`
    message += `Seconds per Round: ${gameConfig.secondsPerRound}\n`
    message += `Seconds per Round End: ${gameConfig.secondsPerRoundEnd}\n`
    message += `Word Length: ${gameConfig.wordLength === -1 ? 'Disabled' : gameConfig.wordLength}`

    server.publish(room.id, chatMessage(message))
  },
}
