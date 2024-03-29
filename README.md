# wordbun

Fast & light implementation for wordgames, a word games server for WebSockets

## APIs used

Random word API at https://random-word-api.herokuapp.com

## List of games

1. `ws/anagram` Normal anagrams game. Features:

- Multiple language support
- Time configuration
- Word length configuration
- Timer configuration

## How to play?

Connect to `wss://your-server-address/ws/anagram/{room ID}` and type `/help`!
Room ID can be any string.

## Frontends

- [PixelSam123/wordgames-client](https://github.com/PixelSam123/wordgames-client)
- [PixelSam123/wordgames_dc](https://github.com/PixelSam123/wordgames_dc)
- [PixelSam123/wordgamestui](https://github.com/PixelSam123/wordgamestui)
- [pixelsam123.github.io/minigames](https://pixelsam123.github.io/minigames)

## Spinning it up

Instructions to run available from Bun's README below.

To install dependencies:

```bash
bun install
```

To run:

```bash
bun start
```

This project was created using `bun init` in bun v1.0.35. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
