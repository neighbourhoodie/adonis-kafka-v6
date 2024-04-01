import { Kafka as KafkaJs, Admin } from 'kafkajs'
import type { Consumer } from './consumer.ts'
import type { Producer } from './producer.ts'

import { Kafka } from './index.ts'

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    kafka: Kafka
  }

  export interface KafkaConfig {
    enabled: boolean
    clientId: string
    groupId: string
    url: string
    port: number
    urls?: string | null
    connectionTimeout?: number
    requestTimeout?: number
    logLevel: any
  }

  export interface KafkaContract {
    start: (...args: any[]) => void
    disconnect: () => void
    consumers: Consumer[]
    producers: Producer[]
    kafka: KafkaJs
    admin?: Admin
  }
}
export * from 'kafkajs'
