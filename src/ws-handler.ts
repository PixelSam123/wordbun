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

/start [options]
Start a new game. List of options:
  -d, --dictionary
  Choose a dictionary. Default is id
  Available options are: id, hoyo, gi, hsr, js-topic
  -r, --round-count
  Number of rounds. Default is 10
  -t, --time-per-round
  Time per round in seconds. Default is 20
  -e, --time-per-round-end
  Time per round end in seconds. Default is 5
  -l, --word-length
  Word length. Default depends on dictionary
  Set to -1 to disable

/skip
Skip your turn in a round.`

function handleBaseCommands(message: string): string | null {
  if (message === '/clear') {
    return chatMessage(
      'Clearing is not handled by the server. Please handle it in your client.',
    )
  }

  if (message === '/help') {
    return chatMessage(helpMessage)
  }

  if (message === '/ping') {
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
      response: `Welcome, ${username}! Type /help for help, or for how to start the game.`,
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
