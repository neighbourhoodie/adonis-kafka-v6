import {
  ProducerConfig as KafkaProducerConfig,
  ConsumerConfig as KafkaConsumerConfig,
  ConsumerRunConfig as KafkaConsumerRunConfig,
  Message as KafkaMessage,
} from 'kafkajs'

import type { Level } from '@adonisjs/logger/types'

import type { ConsumerGroup } from './consumer.ts'
import type { Producer } from './producer.ts'

import { Kafka } from './index.ts'

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
    createProducer(name: string, config: KafkaProducerConfig): Producer
    createConsumerGroup(config: KafkaConsumerConfig, runConfig: ConsumerRunConfig): ConsumerGroup
  }
}

export type ConsumerRunConfig = Omit<KafkaConsumerRunConfig, 'eachMessage' | 'eachBatch'>

export interface SendMessage extends KafkaMessage {
  value: any
}

export * from 'kafkajs'
