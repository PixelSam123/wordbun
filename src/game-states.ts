import { finishedRoundInfo, ongoingRoundInfo } from './message-factories'
import { shuffleString } from './utils'

export type GameConfig = {
  dictionary: string
  roundCount: number
  secondsPerRound: number
  secondsPerRoundEnd: number
  wordLength: number
}

export interface GameState {
  getRoundInfo(): string
  getRoundsLeft(): number
  getUnderlyingConfig(): GameConfig
  /**
   * Handles an incoming chat message for the current game state.
   *
   * @returns {string | null} Return null to fall back to the room's message handler,
   * or a string to override it with a custom response.
   */
  handleMessage(
    message: string,
    username: string,
    userCount: number,
  ): string | null
}

export class GameOngoingRound implements GameState {
  private readonly usernamesAnswered: string[] = []
  private readonly endTimeout: Timer
  private readonly wordToGuess: string
  private readonly roundFinishTime: string

  constructor(
    private readonly remainingWords: string[],
    private readonly config: GameConfig,
    private readonly onPlayerReceivePoints: (
      username: string,
      points: number,
    ) => void,
    private readonly onStateEnd: (
      next: GameState | null,
      stateEndMessage: string | null,
    ) => void,
  ) {
    this.endTimeout = setTimeout(() => {
      this.endState()
    }, config.secondsPerRound * 1_000)

    let wordToGuess = remainingWords[0]
    while (wordToGuess === remainingWords[0]) {
      wordToGuess = shuffleString(remainingWords[0])
    }
    this.wordToGuess = wordToGuess

    const roundFinishTime = new Date()
    roundFinishTime.setSeconds(
      roundFinishTime.getSeconds() + config.secondsPerRound,
    )
    this.roundFinishTime = roundFinishTime.toISOString()
  }

  getRoundInfo(): string {
    return ongoingRoundInfo({
      wordToGuess: this.wordToGuess,
      roundFinishTime: this.roundFinishTime,
    })
  }

  getRoundsLeft(): number {
    return this.remainingWords.length - 1
  }

  getUnderlyingConfig(): GameConfig {
    return this.config
  }

  handleMessage(
    message: string,
    username: string,
    userCount: number,
  ): string | null {
    if (message === '/skip' || message === this.remainingWords[0]) {
      const isSkip = message === '/skip'

      if (this.usernamesAnswered.includes(username)) {
        return 'You already answered/skipped...'
      }

      this.usernamesAnswered.push(username)
      this.onPlayerReceivePoints(
        username,
        isSkip ? -1 : this.usernamesAnswered.length === 1 ? 3 : 2,
      )
      if (userCount === this.usernamesAnswered.length) {
        this.endState()
      }

      return `You are #${this.usernamesAnswered.length}/${userCount} to ${isSkip ? 'skip' : 'answer'} this round.`
    }

    return null
  }

  private endState() {
    clearTimeout(this.endTimeout)

    this.onStateEnd(
      new GameFinishedRound(
        this.remainingWords,
        this.config,
        this.onPlayerReceivePoints,
        this.onStateEnd,
      ),
      `${this.getRoundsLeft()} round(s) left.`,
    )
  }
}

export class GameFinishedRound implements GameState {
  private readonly endTimeout: Timer
  private readonly toNextRoundTime: string

  constructor(
    private readonly remainingWords: string[],
    private readonly config: GameConfig,
    private readonly onPlayerReceivePoints: (
      username: string,
      points: number,
    ) => void,
    private readonly onStateEnd: (
      next: GameState | null,
      stateEndMessage: string | null,
    ) => void,
  ) {
    this.endTimeout = setTimeout(() => {
      this.endState()
    }, config.secondsPerRoundEnd * 1_000)

    const toNextRoundTime = new Date()
    toNextRoundTime.setSeconds(
      toNextRoundTime.getSeconds() + config.secondsPerRoundEnd,
    )
    this.toNextRoundTime = toNextRoundTime.toISOString()
  }

  getRoundInfo(): string {
    return finishedRoundInfo({
      wordAnswer: this.remainingWords[0],
      toNextRoundTime: this.toNextRoundTime,
    })
  }

  getRoundsLeft(): number {
    return this.remainingWords.length - 1
  }

  getUnderlyingConfig(): GameConfig {
    return this.config
  }

  handleMessage(message: string): string | null {
    return null
  }

  private endState() {
    clearTimeout(this.endTimeout)

    if (this.remainingWords.length === 1) {
      this.onStateEnd(null, null)
    } else {
      this.onStateEnd(
        new GameOngoingRound(
          this.remainingWords.slice(1),
          this.config,
          this.onPlayerReceivePoints,
          this.onStateEnd,
        ),
        null,
      )
    }
  }
}
