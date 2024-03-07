import { RecordMetadata, Kafka as KafkaJs, Admin } from 'kafkajs'
import type { Consumer } from './consumer.ts'
import type { Producer } from './producer.ts'

import { Kafka } from './index.ts'

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    Kafka: Kafka
  }

  export interface KafkaConfig {
    enabled: boolean
    clientId: string
    groupId: string
    url: string
    port: number
    urls?: string | null
    fromBeginning: boolean
    autoCommit: boolean
    connectionTimeout?: number
    requestTimeout?: number
    partitionsConcurrently?: number
    logLevel: any
  }

  export interface KafkaContract {
    start: (...args: any[]) => void
    on: (...args: any[]) => void
    send: (topic: string, data: object) => Promise<RecordMetadata[] | undefined>
    disconnect: () => void
    consumer: Consumer
    producer: Producer
    kafka: KafkaJs
    admin?: Admin
  }
}
export * from 'kafkajs'
