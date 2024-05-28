import type {
  ConsumerConfig as KafkaConsumerConfig,
  ProducerConfig as KafkaProducerConfig,
  ConsumerRunConfig as KafkaConsumerRunConfig,
  Message as KafkaMessage,
  EachMessagePayload as KafkaEachMessagePayload,
} from 'kafkajs'
import type { Level } from '@adonisjs/logger/types'
import type { Consumer } from './consumer.ts'
import type { Producer } from './producer.ts'

import { Kafka } from './index.ts'

export type ProducerConfig = KafkaProducerConfig

export type ConsumerGroupConfig = KafkaConsumerConfig &
  Omit<KafkaConsumerRunConfig, 'eachMessage' | 'eachBatch'>

export type ConsumerSubscribeTopic = { topic: string; fromBeginning?: boolean }
export type ConsumerSubscribeTopics = { topics: string[]; fromBeginning?: boolean }

export type ConsumerPayload = KafkaMessage
export type ConsumerCommitCallback = (commit: boolean) => Promise<void>
export type ConsumerCallback = (
  payload: ConsumerPayload,
  commit: ConsumerCommitCallback,
  heartbeat: KafkaEachMessagePayload['heartbeat'],
  pause: KafkaEachMessagePayload['pause']
) => Promise<void>

export type ConsumerErrorHandler = (error: Error) => void

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    kafka: Kafka
  }

  export interface KafkaConfig {
    brokers?: string | string[]
    clientId?: string
    connectionTimeout?: number
    requestTimeout?: number
    logLevel: Level
  }

  export interface KafkaContract {
    start: (...args: any[]) => void
    disconnect: () => void
    createProducer(name: string, config?: ProducerConfig): Producer
    createConsumer(config: ConsumerGroupConfig): Consumer
  }
}

export interface SendMessage extends KafkaMessage {
  value: any
}

export * from 'kafkajs'
