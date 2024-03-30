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
    if (message.startsWith('/list')) {
      return Array.from(this.usernameToPlayerData.entries())
        .map(
          ([username, playerData]) =>
            `${username} -> ${playerData.points}${
              playerData.leaveTimeout ? ' (disconnected)' : ''
            }`,
        )
        .join('\n')
    }

    if (message.startsWith('/start')) {
      return 'Requested a new game.'
    }

    return null
  }
}
