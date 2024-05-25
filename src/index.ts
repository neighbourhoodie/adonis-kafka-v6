import { Kafka as KafkaJs } from 'kafkajs'
import { type ProducerConfig, type ConsumerConfig } from 'kafkajs'

import type { Logger } from '@adonisjs/core/logger'
import { ApplicationService, KafkaConfig, KafkaContract } from '@adonisjs/core/types'

import { ConsumerGroup } from './consumer.ts'
import { Producer } from './producer.ts'
import { defineConfig } from './define_config.ts'
import { type KafkaLogLevel, toAdonisLoggerLevel, toKafkaLogLevel } from './logging.ts'
import { ConsumerRunConfig } from './types.ts'

export class Kafka implements KafkaContract {
  protected application!: ApplicationService

  #consumers: ConsumerGroup[]
  #producers: {
    [key: string]: Producer
  }

  #kafka!: KafkaJs
  #config: KafkaConfig
  #logger: Logger

  constructor(logger: Logger, config: KafkaConfig) {
    this.#config = defineConfig(config)
    this.#logger = logger.child({ module: 'kafka' })
    this.#consumers = []
    this.#producers = {}
  }

  async start() {
    this.createKafka()
  }

  createProducer(name: string, config: ProducerConfig) {
    // TODO: we probably have to break out consumer/producer option config types from KafkaConfig
    if (this.#producers[name]) {
      throw new Error(`producer with name '${name}' already exists`)
    }

    const producer = new Producer(this.#kafka, config)
    this.#producers[name] = producer

    return producer
  }

  createConsumerGroup(config: ConsumerConfig, runConfig?: ConsumerRunConfig) {
    const consumer = new ConsumerGroup(this.#kafka, config, runConfig ?? {})

    this.#consumers.push(consumer)

    return consumer
  }

  get producers() {
    return this.#producers
  }

  get consumers() {
    return this.#consumers
  }

  private getBrokers() {
    if (!this.#config.brokers) {
      // This is the default host/port for Kafka:
      return ['localhost:9092']
    } else {
      return Array.isArray(this.#config.brokers)
        ? this.#config.brokers
        : this.#config.brokers.split(',')
    }
  }

  private createKafka() {
    this.#kafka = new KafkaJs({
      brokers: this.getBrokers(),
      clientId: this.#config.clientId || 'local',
      connectionTimeout: this.#config.connectionTimeout,
      requestTimeout: this.#config.requestTimeout,
      logLevel: toKafkaLogLevel(this.#config.logLevel),
      logCreator: (logLevel: KafkaLogLevel) => {
        this.#logger.level = toAdonisLoggerLevel(logLevel)

        return ({ namespace, level, label: _label, log }) => {
          const { message, timestamp, logger, ...extra } = log
          this.#logger
            .child({ module: `kafka.${namespace}` })
            [toAdonisLoggerLevel(level)]({ ...extra }, log.message)
        }
      },
    })
  }

  async disconnect() {
    for await (let consumer of this.#consumers) {
      await consumer.consumer.disconnect()
    }

    for (let producer in this.#producers) {
      await this.#producers[producer].producer.disconnect()
    }
  }
}
