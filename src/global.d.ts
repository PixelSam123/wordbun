import type { Room } from './room'

declare global {
  var idToRoom: Map<string, Room>
}
