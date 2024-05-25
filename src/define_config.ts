import { KafkaConfig } from '@adonisjs/core/types'

export function defineConfig(config = {}): KafkaConfig {
  return {
    brokers: 'localhost:9092',
    clientId: 'local',
    connectionTimeout: 3000,
    requestTimeout: 60000,
    logLevel: 'info',
    // Overwrite default config values if another one is provided
    ...config,
  }
}
