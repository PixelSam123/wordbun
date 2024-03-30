import { createLogger, format, transports } from 'winston'

export const logger = createLogger({
  format: format.cli(),
  transports: [new transports.Console()],
})
