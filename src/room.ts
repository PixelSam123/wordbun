import { parseArgs } from 'util'
import gi from './wordbanks/gi.txt'
import hoyo from './wordbanks/hoyo.txt'
import hsr from './wordbanks/hsr.txt'
import id from './wordbanks/id.txt'
import jsTopic from './wordbanks/js-topic.txt'
import type { GameConfig, GameState } from './game-states'

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

/** The maximum is exclusive and the minimum is inclusive */
function randomInt(min: number, max: number) {
  const minCeiled = Math.ceil(min)
  const maxFloored = Math.floor(max)
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled)
}

export class Room {
  private static readonly LEAVE_TIMEOUT = 10_000

  private readonly usernameToPlayerData = new Map<string, PlayerData>()

  public readonly id: string
  private readonly handlers: RoomHandlers

  private gameState: GameState | null = null

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

        const wordsOfRequestedLength = dictionaries[
          gameConfig.dictionary
        ]!.words.split('\n').filter(
          (word) =>
            gameConfig.wordLength === -1 ||
            word.length === gameConfig.wordLength,
        )

        if (wordsOfRequestedLength.length < gameConfig.roundCount) {
          return `Not enough words for round count of ${gameConfig.roundCount} and word length of ${gameConfig.wordLength}`
        }

        const wordPool: string[] = []

        while (wordPool.length < gameConfig.roundCount) {
          const randomIdx = randomInt(0, wordsOfRequestedLength.length)
          const randomWord = wordsOfRequestedLength[randomIdx]

          if (!wordPool.includes(randomWord)) {
            wordPool.push(randomWord)
          }
        }

        return 'Requested a new game.'
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
