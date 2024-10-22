import { server } from '.'
import { GameFinishedRound } from './game-states'
import { logger } from './logger'
import { chatMessage, finishedGame } from './message-factories'
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

  onChangeGameState(room, gameState, stateChangeMessage) {
    if (gameState === null) {
      server.publish(room.id, finishedGame())
      server.publish(
        room.id,
        chatMessage(`Game finished! Final points:\n${room.playerListTable()}`),
      )
    } else {
      server.publish(room.id, gameState.getRoundInfo())
      if (gameState instanceof GameFinishedRound) {
        server.publish(
          room.id,
          chatMessage(`Round finished! Points:\n${room.playerListTable()}`),
        )
      }
      if (stateChangeMessage) {
        server.publish(room.id, chatMessage(stateChangeMessage))
      }
    }
  },

  onSuccessfulAnswer(room, username) {
    server.publish(room.id, chatMessage(`${username} answered!`))
  },

  onAnswerSkip(room, username) {
    server.publish(room.id, chatMessage(`${username} skipped!`))
  },
}
