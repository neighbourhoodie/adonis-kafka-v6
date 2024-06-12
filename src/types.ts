import type {
  ConsumerConfig as KafkaConsumerConfig,
  ProducerConfig as KafkaProducerConfig,
  ConsumerRunConfig as KafkaConsumerRunConfig,
  Message as KafkaMessage,
  EachMessagePayload as KafkaEachMessagePayload,
  SASLOptions as KafkaSASLOptions,
  OauthbearerProviderResponse as KafkaOauthbearerProviderResponse,
} from 'kafkajs'

import type tls from 'node:tls'

import type { Level } from '@adonisjs/logger/types'
import type { ConsumerGroup } from './consumer_group.ts'
import type { Producer } from './producer.ts'

import { Kafka } from './index.ts'

// AWS mechanism isn't currently well supported:
type SASLAWSOption = { mechanism: 'aws' } & {
  authorizationIdentity: string
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
}

// OAuth Bearer mechanism isn't currently well supported:
type SASLOAuthOption = {
  mechanism: 'oauthbearer'
} & {
  oauthBearerProvider: () => Promise<KafkaOauthbearerProviderResponse>
}

type SASLOptions = Exclude<KafkaSASLOptions, SASLAWSOption | SASLOAuthOption>

export type ProducerConfig = KafkaProducerConfig

export type ConsumerGroupConfig = KafkaConsumerConfig &
  Omit<KafkaConsumerRunConfig, 'eachMessage' | 'eachBatch'>

export type ConsumerSubscribeTopic = { topic: string; fromBeginning?: boolean }
export type ConsumerSubscribeTopics = { topics: string[]; fromBeginning?: boolean }

export type ConsumerPayload = Record<string, any>
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
    ssl?: tls.ConnectionOptions | boolean
    sasl?: SASLOptions
    clientId?: string
    timeouts?: {
      connection?: number
      authentication?: number
      reauthentication?: number
      request?: number
    }
    logLevel: Level
  }

  export interface KafkaContract {
    boot(...args: any[]): void
    startConsumerGroups(): Promise<void>
    startProducers(): Promise<void>
    stop(): Promise<void>

    createProducer(name: string, config?: ProducerConfig): Producer
    createConsumerGroup(config: ConsumerGroupConfig): ConsumerGroup
  }
}

export interface SendMessage extends KafkaMessage {
  value: any
}

export * from 'kafkajs'
