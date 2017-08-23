import * as winston from 'winston';

const logger = new (winston.Logger)({
  colors: {
    trace: 'magenta',
    debug: 'blue',
    info: 'green',
    warn: 'yellow',
    error: 'red'
  },
  level: 'debug'
});

logger.add(winston.transports.Console, {
  prettyPrint: true,
  colorize: true,
  silent: false,
  timestamp: false
});

export default logger;