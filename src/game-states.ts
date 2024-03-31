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
  handleMessage(message: string): string
}

class GameOngoingRound implements GameState {
  constructor(
    private readonly remainingWords: string[],
    private readonly permanentConfig: PermanentGameConfig,
  ) {}

  getRoundInfo(): string {}

  handleMessage(message: string): string {
    return 'Game is ongoing'
  }
}

class GameFinishedRound implements GameState {
  constructor(
    private readonly remainingWords: string[],
    private readonly permanentConfig: PermanentGameConfig,
  ) {}

  getRoundInfo(): string {}

  handleMessage(message: string): string {
    return 'Game is finished'
  }
}
