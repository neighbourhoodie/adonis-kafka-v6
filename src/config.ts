import { KafkaConfig } from '@adonisjs/core/types'

function makeKafkaConfig(env: any): KafkaConfig {
  return {
    enabled: env.get('KAFKA_ENABLED', false),
    clientId: env.get('KAFKA_CLIENT_ID', 'default-client'),
    groupId: env.get('KAFKA_GROUP_ID', 'default-group'),
    url: env.get('KAFKA_URL', 'localhost'),
    port: env.get('KAFKA_PORT', 9092),
    urls: env.get('KAFKA_URLS', null),
    fromBeginning: env.get('KAFKA_FROM_BEGINNING', true),
    autoCommit: env.get('KAFKA_AUTO_COMMIT', false),
    partitionsConcurrently: env.get('KAFKA_PARTITIONS_CONCURRENTLY', 1),
    connectionTimeout: env.get('KAFKA_CONNECTION_TIMEOUT', 3000),
    requestTimeout: env.get('KAFKA_REQUEST_TIMEOUT', 60000),
    logLevel: env.get('KAFKA_LOG_LEVEL', 1),
  }
}

export default makeKafkaConfig
