import {
  ProducerConfig as KafkaProducerConfig,
  ConsumerConfig as KafkaConsumerConfig,
} from 'kafkajs'
import type { Level } from '@adonisjs/logger/types'
import type { Consumer } from './consumer.ts'
import type { Producer } from './producer.ts'

import { Kafka } from './index.ts'

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    kafka: Kafka
  }

  export interface KafkaConfig {
    brokers?: string | string[]
    clientId?: string
    groupId?: string
    connectionTimeout?: number
    requestTimeout?: number
    logLevel: Level
  }

  export interface KafkaContract {
    start: (...args: any[]) => void
    disconnect: () => void
    createProducer(name: string, config: KafkaProducerConfig): Producer
    createConsumer(config: KafkaConsumerConfig): Consumer
  }
}
export * from 'kafkajs'
