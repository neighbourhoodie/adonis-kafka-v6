import { Level } from '@adonisjs/logger/types'
import { logLevel } from 'kafkajs'

export type KafkaLogLevel = logLevel

export const toAdonisLoggerLevel = (level: KafkaLogLevel) => {
  switch (level) {
    case logLevel.ERROR:
    case logLevel.NOTHING:
      return 'error'
    case logLevel.WARN:
      return 'warn'
    case logLevel.INFO:
      return 'info'
    case logLevel.DEBUG:
      return 'debug'
  }
}

export const toKafkaLogLevel = (level: Level) => {
  switch (level) {
    case 'debug':
    case 'fatal':
    case 'trace':
      return logLevel.DEBUG
    case 'error':
      return logLevel.ERROR
    case 'info':
      return logLevel.INFO
    case 'warn':
      return logLevel.WARN
    default:
      return logLevel.NOTHING
  }
}
