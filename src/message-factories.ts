export function chatMessage(content: string) {
  return JSON.stringify({
    type: 'ChatMessage',
    content,
  })
}

export function pongMessage() {
  return JSON.stringify({
    type: 'PongMessage',
    content: null,
  })
}

export function ongoingRoundInfo(content: {
  wordToGuess: string
  roundFinishTime: string
}) {
  return JSON.stringify({
    type: 'OngoingRoundInfo',
    content: {
      word_to_guess: content.wordToGuess,
      round_finish_time: content.roundFinishTime,
    },
  })
}

export function finishedRoundInfo(content: {
  wordAnswer: string
  toNextRoundTime: string
}) {
  return JSON.stringify({
    type: 'FinishedRoundInfo',
    content: {
      word_answer: content.wordAnswer,
      to_next_round_time: content.toNextRoundTime,
    },
  })
}

export function finishedGame() {
  return JSON.stringify({
    type: 'FinishedGame',
    content: null,
  })
}
