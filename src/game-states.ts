import { finishedRoundInfo, ongoingRoundInfo } from './message-factories'
import { shuffleString } from './utils'

export type GameConfig = {
  dictionary: string
  roundCount: number
  secondsPerRound: number
  secondsPerRoundEnd: number
  wordLength: number
}

type PermanentGameConfig = {
  secondsPerRound: number
  secondsPerRoundEnd: number
}

export interface GameState {
  getRoundInfo(): string
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
    private readonly permanentConfig: PermanentGameConfig,
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
    }, permanentConfig.secondsPerRound * 1_000)

    let wordToGuess = remainingWords[0]
    while (wordToGuess === remainingWords[0]) {
      wordToGuess = shuffleString(remainingWords[0])
    }
    this.wordToGuess = wordToGuess

    const roundFinishTime = new Date()
    roundFinishTime.setSeconds(
      roundFinishTime.getSeconds() + permanentConfig.secondsPerRound,
    )
    this.roundFinishTime = roundFinishTime.toISOString()
  }

  getRoundInfo(): string {
    return ongoingRoundInfo({
      wordToGuess: this.wordToGuess,
      roundFinishTime: this.roundFinishTime,
    })
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
        this.permanentConfig,
        this.onPlayerReceivePoints,
        this.onStateEnd,
      ),
      `${this.remainingWords.length - 1} round(s) left.`,
    )
  }
}

export class GameFinishedRound implements GameState {
  private readonly endTimeout: Timer
  private readonly toNextRoundTime: string

  constructor(
    private readonly remainingWords: string[],
    private readonly permanentConfig: PermanentGameConfig,
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
    }, permanentConfig.secondsPerRoundEnd * 1_000)

    const toNextRoundTime = new Date()
    toNextRoundTime.setSeconds(
      toNextRoundTime.getSeconds() + permanentConfig.secondsPerRoundEnd,
    )
    this.toNextRoundTime = toNextRoundTime.toISOString()
  }

  getRoundInfo(): string {
    return finishedRoundInfo({
      wordAnswer: this.remainingWords[0],
      toNextRoundTime: this.toNextRoundTime,
    })
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
          this.permanentConfig,
          this.onPlayerReceivePoints,
          this.onStateEnd,
        ),
        null,
      )
    }
  }
}
