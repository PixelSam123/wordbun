export function publicRoom(data: {
  roomId: string
  playerCount: number
  currentDictionary: string | null
}) {
  return {
    room_id: data.roomId,
    player_count: data.playerCount,
    current_dictionary: data.currentDictionary,
  }
}
