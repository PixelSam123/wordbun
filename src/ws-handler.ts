import type { WebSocketHandler } from 'bun'
import { chatMessage, pongMessage } from './message-factories'
import { Room } from './room'
import { roomHandler } from './room-handler'
import { server } from '.'

type WSData = {
  roomId: string
  username?: string
}

const helpMessage = `\
Commands:
/help
Show this message

/list
List the players in a room

/start
Start a new game with default settings.

/start {dictionary}
Start a game with default settings, but choose a dictionary.
Available options are: en, id, hoyo, gi, hsr, js-topic

/start {dictionary} {roundCount} {timePerRound}
Start a new game with custom settings. Time per round is in seconds.

/start {dictionary} {roundCount} {timePerRound} {wordLength}
Start a new game with custom settings. Time per round is in seconds.
Additionally specify the word length. Ideal for big dictionaries.

/skip
Skip your turn in a round.`

function handleBaseCommands(message: string): string | null {
  if (message.startsWith('/clear')) {
    return chatMessage(
      'Clearing is not handled by the server. Please handle it in your client.',
    )
  }

  if (message.startsWith('/help')) {
    return chatMessage(helpMessage)
  }

  if (message.startsWith('/ping')) {
    return pongMessage()
  }

  return null
}

function handleUsernameEntry(
  room: Room,
  username: string,
): { isSuccess: boolean; response: string } {
  try {
    room.addPlayer(username)

    return {
      isSuccess: true,
      response: 'Welcome! Type /help for help, or for how to start the game.',
    }
  } catch (err) {
    return {
      isSuccess: false,
      response: `Username ${username} is already in room!`,
    }
  }
}

export const wsHandler: WebSocketHandler<WSData> = {
  open(ws) {
    ws.sendText(chatMessage('Please enter username in chat.'))
  },

  message(ws, msg) {
    const message = String(msg).trim()
    if (!message) {
      return
    }

    {
      const response = handleBaseCommands(message)
      if (response) {
        ws.sendText(response)
        return
      }
    }

    const room =
      idToRoom.get(ws.data.roomId) ??
      new Room({
        id: ws.data.roomId,
        handlers: roomHandler,
      })

    if (!ws.data.username) {
      const { isSuccess, response } = handleUsernameEntry(room, message)
      ws.sendText(chatMessage(response))

      if (isSuccess) {
        ws.data.username = message
        ws.subscribe(room.id)
      }

      return
    }

    {
      const response = room.handleCommand(message)
      if (response) {
        ws.sendText(chatMessage(response))
        return
      }
    }

    server.publish(
      ws.data.roomId,
      chatMessage(`${ws.data.username}: ${message}`),
    )
  },

  close(ws) {
    ws.unsubscribe(ws.data.roomId)

    const room = idToRoom.get(ws.data.roomId)

    if (room && ws.data.username) {
      room.removePlayer(ws.data.username)
    }
  },
}
