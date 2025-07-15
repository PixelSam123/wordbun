# wordbun

![wordbun banner](<https://raw.githubusercontent.com/PixelSam123/wordbun/refs/heads/main/docs/wordbun.webpa>)

Fast & light implementation for wordgames, a word games server for WebSockets

## I just wanna play!

Head over to [pixelsam123.github.io/games/anagrams](https://pixelsam123.github.io/games/anagrams) to play right on the web client!

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

- Rust: [PixelSam123/wordgames-client](https://github.com/PixelSam123/wordgames-client)
- Flutter: [PixelSam123/wordgames_dc](https://github.com/PixelSam123/wordgames_dc)
- Go TUI: [PixelSam123/wordgamestui](https://github.com/PixelSam123/wordgamestui)
- Web: [pixelsam123.github.io/games/anagrams](https://pixelsam123.github.io/games/anagrams)

## Highlights over the Java version

- Abandoned random word API usage
- Added room-listing endpoint
- Added accidental disconnection handling (gives you time to reconnect)
- Much more convenient format to start a game

## APIs used

No APIs used. Word banks come from text files.

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
