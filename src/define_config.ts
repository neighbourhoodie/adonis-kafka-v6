import { KafkaConfig } from '@adonisjs/core/types'

function defineConfig(config = {}): KafkaConfig {
  return {
    enabled: false,
    clientId: 'default-client',
    groupId: 'default-group',
    url: 'localhost',
    port: 9092,
    fromBeginning: true,
    autoCommit: false,
    partitionsConcurrently: 1,
    connectionTimeout: 3000,
    requestTimeout: 60000,
    logLevel: 1,
    // Overwrite default config values if another one is provided
    ...config,
  }
}

export default defineConfig
