import { Admin, Kafka as KafkaJs } from 'kafkajs'
import { type ProducerConfig, type ConsumerConfig } from 'kafkajs'

import { type Logger } from '@adonisjs/core/logger'
import { ApplicationService, KafkaConfig, KafkaContract } from '@adonisjs/core/types'

import { Consumer } from './consumer.ts'
import { Producer } from './producer.ts'
import { defineConfig } from './define_config.ts'

export class Kafka implements KafkaContract {
  protected application!: ApplicationService

  consumers!: Consumer[]
  producers!: Producer[]
  kafka!: KafkaJs
  config: KafkaConfig
  Logger: Logger
  admin?: Admin

  constructor(Logger: Logger, config: KafkaConfig) {
    this.config = defineConfig(config)
    this.Logger = Logger
  }

  async start() {
    const { groupId } = this.config

    if (groupId === null || groupId === undefined || groupId === '') {
      throw new Error('You need define a group')
    }

    this.createKafka()
  }

  createProducer(config: ProducerConfig) {
    // TODO: we probably have to break out consumer/producer option config types from KafkaConfig
    const producer = new Producer(this.kafka, config, this.config.enabled)
    this.producers.push(producer)
    return producer
  }

  createConsumer(config: ConsumerConfig) {
    const consumer = new Consumer(this.kafka, config)
    this.consumers.push(consumer)
    return consumer
  }

  private createKafka() {
    const brokers = this.config.urls ? this.config.urls.split(',') : null

    this.kafka = new KafkaJs({
      clientId: this.config.clientId || 'local',
      brokers: brokers || [`${this.config.url}:${this.config.port}`],
      connectionTimeout: this.config.connectionTimeout,
      requestTimeout: this.config.requestTimeout,
      logLevel: this.config.logLevel,
    })

    if (this.kafka !== undefined) {
      this.admin = this.kafka.admin()
      this.admin.connect().catch((e) => this.Logger.error(`[admin] ${e.message}`, e))
    }
  }

  async disconnect() {
    for await (let consumer of this.consumers) {
      await consumer.consumer.disconnect()
    }
  }
}
