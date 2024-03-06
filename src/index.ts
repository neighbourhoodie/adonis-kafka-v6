import { Admin, Kafka as KafkaJs } from 'kafkajs'
import { type Logger } from '@adonisjs/core/logger'
import { ApplicationService, KafkaConfig, KafkaContract } from '@adonisjs/core/types'

import Consumer from './consumer.ts'
import Producer from './producer.ts'
import makeKafkaConfig from './config.ts'

export default class Kafka implements KafkaContract {
  protected application!: ApplicationService

  consumer!: Consumer
  producer!: Producer
  kafka!: KafkaJs
  config: KafkaConfig
  Logger: Logger
  admin?: Admin

  constructor(Logger: Logger, env: any) {
    this.config = makeKafkaConfig(env)
    this.Logger = Logger
  }

  async start() {
    const { groupId } = this.config

    if (groupId === null || groupId === undefined || groupId === '') {
      throw new Error('You need define a group')
    }

    this.createKafka()

    this.consumer = new Consumer(this.kafka, this.config)
    this.producer = new Producer(this.kafka, this.config)

    this.producer.start()
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

  on(topic: string, callback: any) {
    if (this.config.enabled !== 'true') return callback
    if (this.consumer === undefined) {
      this.start()
    }
    this.consumer.on(topic, callback)
  }

  async send(topic: string, data: any) {
    if (this.config.enabled !== 'true') return
    if (this.producer === undefined) {
      this.start()
    }
    return await this.producer.send(topic, data)
  }

  async disconnect() {
    await this.consumer.consumer.disconnect()
  }
}
