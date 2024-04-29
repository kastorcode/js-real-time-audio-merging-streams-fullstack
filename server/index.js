import { PORT } from './config.js'
import CreateServer from './server.js'
import { logger } from './util.js'


CreateServer().listen(PORT).on('listening', () =>
  logger.info(`Server listening at ${PORT}`))


process.on('uncaughtException', error => logger.error(`uncaughtException\n${error}`))

process.on('unhandledRejection', error => logger.error(`unhandledRejection\n${error}`))