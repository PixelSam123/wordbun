import { parseArgs } from 'util'
import gi from './wordbanks/gi.txt'
import hoyo from './wordbanks/hoyo.txt'
import hsr from './wordbanks/hsr.txt'
import id from './wordbanks/id.txt'
import jsTopic from './wordbanks/js-topic.txt'

type PlayerData = {
  points: number
  leaveTimeout?: Timer
}

type RoomCallback = (room: Room) => void
type RoomPlayerCallback = (room: Room, username: string) => void

export type RoomHandlers = {
  onFirstPlayerAdded: RoomCallback
  onLastPlayerRemoved: RoomCallback
  onPlayerAdded: RoomPlayerCallback
  onPlayerRemoved: RoomPlayerCallback
}

type GameConfig = {
  dictionary: string
  roundCount: number
  secondsPerRound: number
  secondsPerRoundEnd: number
  wordLength: number
}

const dictionaries: {
  [name: string]: { words: string; defaultWordLength: number } | undefined
} = {
  id: {
    words: id,
    defaultWordLength: 5,
  },
  hoyo: {
    words: hoyo,
    defaultWordLength: -1,
  },
  gi: {
    words: gi,
    defaultWordLength: -1,
  },
  hsr: {
    words: hsr,
    defaultWordLength: -1,
  },
  'js-topic': {
    words: jsTopic,
    defaultWordLength: -1,
  },
}

export class Room {
  private static readonly LEAVE_TIMEOUT = 10_000

  private readonly usernameToPlayerData = new Map<string, PlayerData>()

  public readonly id: string
  private readonly handlers: RoomHandlers

  get playerCount(): number {
    return this.usernameToPlayerData.size
  }

  constructor(args: { id: string; handlers: RoomHandlers }) {
    this.id = args.id
    this.handlers = args.handlers
  }

  addPlayer(username: string): void {
    {
      const existingPlayerData = this.usernameToPlayerData.get(username)

      if (existingPlayerData) {
        if (existingPlayerData.leaveTimeout) {
          clearTimeout(existingPlayerData.leaveTimeout)
          existingPlayerData.leaveTimeout = undefined

          return
        }

        throw new Error(`Username already exists in room: ${username}`)
      }
    }

    this.usernameToPlayerData.set(username, { points: 0 })

    if (this.usernameToPlayerData.size === 1) {
      this.handlers.onFirstPlayerAdded(this)
    }
    this.handlers.onPlayerAdded(this, username)
  }

  removePlayer(username: string): void {
    const playerData = this.usernameToPlayerData.get(username)

    if (!playerData) {
      throw new Error(`Username does not exist in room: ${username}`)
    }

    playerData.leaveTimeout = setTimeout(() => {
      this.usernameToPlayerData.delete(username)

      this.handlers.onPlayerRemoved(this, username)
      if (this.usernameToPlayerData.size === 0) {
        this.handlers.onLastPlayerRemoved(this)
      }
    }, Room.LEAVE_TIMEOUT)
  }

  handleCommand(message: string): string | null {
    if (message === '/list') {
      return this.playerListTable()
    }

    if (message.startsWith('/start')) {
      try {
        const parsed = parseArgs({
          args: message.split(/ +/).slice(1),
          options: {
            dictionary: {
              short: 'd',
              type: 'string',
              default: 'id',
            },
            'round-count': {
              short: 'r',
              type: 'string',
              default: '10',
            },
            'time-per-round': {
              short: 't',
              type: 'string',
              default: '20',
            },
            'time-per-round-end': {
              short: 'e',
              type: 'string',
              default: '5',
            },
            'word-length': {
              short: 'l',
              type: 'string',
            },
          },
        }).values

        const gameConfig: GameConfig = {
          dictionary: parsed.dictionary!,
          roundCount: Number(parsed['round-count']),
          secondsPerRound: Number(parsed['time-per-round']),
          secondsPerRoundEnd: Number(parsed['time-per-round-end']),
          wordLength: parsed['word-length']
            ? Number(parsed['word-length'].replace(/[^0-9-]/g, ''))
            : -1,
        }

        if (!dictionaries[gameConfig.dictionary]) {
          return `Invalid dictionary: ${gameConfig.dictionary}`
        }

        if (isNaN(gameConfig.roundCount) || gameConfig.roundCount < 1) {
          return 'Round count must be at least 1'
        }

        if (
          isNaN(gameConfig.secondsPerRound) ||
          gameConfig.secondsPerRound < 1
        ) {
          return 'Seconds per round must be at least 1'
        }

        if (
          isNaN(gameConfig.secondsPerRoundEnd) ||
          gameConfig.secondsPerRoundEnd < 1
        ) {
          return 'Seconds per round end must be at least 1'
        }

        if (!parsed['word-length']) {
          gameConfig.wordLength =
            dictionaries[gameConfig.dictionary]!.defaultWordLength
        } else if (
          isNaN(gameConfig.wordLength) ||
          (gameConfig.wordLength < 2 && gameConfig.wordLength !== -1)
        ) {
          return 'If not disabled (-1), word length must be at least 2'
        }

        return JSON.stringify(parsed) + '\n' + JSON.stringify(gameConfig)
      } catch (err) {
        return String(err)
      }
    }

    return null
  }

  private playerListTable(): string {
    return Array.from(this.usernameToPlayerData.entries())
      .sort(([_, a], [__, b]) => b.points - a.points)
      .map(
        ([username, playerData]) =>
          `${username} -> ${playerData.points}${
            playerData.leaveTimeout ? ' (disconnected)' : ''
          }`,
      )
      .join('\n')
  }
}
