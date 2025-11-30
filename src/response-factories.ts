export function publicRoom(data: {
  roomId: string
  playerCount: number
  currentDictionary: string | null
  currentGameRoundsLeft: number | null
  currentGameRoundCount: number | null
}) {
  return {
    room_id: data.roomId,
    player_count: data.playerCount,
    current_dictionary: data.currentDictionary,
    current_game_rounds_left: data.currentGameRoundsLeft,
    current_game_round_count: data.currentGameRoundCount,
  }
}
