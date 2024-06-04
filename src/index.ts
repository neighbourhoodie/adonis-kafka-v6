import { Kafka as KafkaJs } from 'kafkajs'
import type { Logger } from '@adonisjs/core/logger'
import { ApplicationService, KafkaConfig, KafkaContract } from '@adonisjs/core/types'

import type { ProducerConfig, ConsumerGroupConfig } from './types.ts'
import { ConsumerGroup } from './consumer_group.ts'
import { Producer } from './producer.ts'
import { defineConfig } from './define_config.ts'
import { type KafkaLogLevel, toAdonisLoggerLevel, toKafkaLogLevel } from './logging.ts'

export class Kafka implements KafkaContract {
  protected application!: ApplicationService

  #consumerGroups: ConsumerGroup[]
  #producers: {
    [key: string]: Producer
  }

  #kafka!: KafkaJs
  #config: KafkaConfig
  #logger: Logger

  constructor(config: KafkaConfig, logger: Logger) {
    this.#config = defineConfig(config)
    this.#logger = logger.child({ module: 'kafka' })
    this.#consumerGroups = []
    this.#producers = {}
  }

  async boot() {
    this.createKafka()
  }

  createProducer(name: string, config: ProducerConfig = {}) {
    if (this.#producers[name]) {
      throw new Error(`producer with name '${name}' already exists`)
    }

    const producer = new Producer(this.#kafka, config)
    this.#producers[name] = producer

    return producer
  }

  createConsumerGroup(config: ConsumerGroupConfig) {
    // TODO: Assert that consumers have different groupId's
    const consumerGroup = new ConsumerGroup(this.#kafka, config)

    this.#consumerGroups.push(consumerGroup)

    return consumerGroup
  }

  async startConsumerGroups() {
    for (const consumerGroup of this.#consumerGroups) {
      await consumerGroup.start()
    }
  }

  async startProducers() {
    for (const producer in this.#producers) {
      await this.#producers[producer].start()
    }
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
      ssl: this.#config.ssl,
      sasl: this.#config.sasl,
      clientId: this.#config.clientId,
      connectionTimeout: this.#config.timeouts?.connection,
      requestTimeout: this.#config.timeouts?.request,
      authenticationTimeout: this.#config.timeouts?.authentication,
      reauthenticationThreshold: this.#config.timeouts?.reauthentication,
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

  async stop() {
    for await (let consumerGroup of this.#consumerGroups) {
      await consumerGroup.stop()
    }

    for (let producer in this.#producers) {
      await this.#producers[producer].stop()
    }
  }
}
