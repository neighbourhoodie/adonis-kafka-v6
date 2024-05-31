import { Kafka, Consumer as KafkaConsumer } from 'kafkajs'
import { type EachMessagePayload } from 'kafkajs'

import type {
  ConsumerGroupConfig,
  ConsumerSubscribeTopics,
  ConsumerSubscribeTopic,
  ConsumerErrorHandler,
  ConsumerCallback,
  ConsumerCommitCallback,
} from './types.ts'

export class ConsumerGroup {
  config: ConsumerGroupConfig
  topics: string[]
  events: Record<string, ConsumerCallback[]>
  errorHandlers: Record<string, ConsumerErrorHandler[]>
  consumer: KafkaConsumer

  #started: boolean = false

  constructor(kafka: Kafka, config: ConsumerGroupConfig) {
    this.config = config
    this.topics = []
    this.events = {}
    this.errorHandlers = {}

    this.consumer = kafka.consumer(this.config)
  }

  async eachMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message, heartbeat, pause } = payload

    let result: any
    try {
      if (!message.value) {
        return
      }
      result = JSON.parse(message.value.toString())
    } catch (error) {
      this.handleError(topic, error)
      return
    }

    const callbacks = this.events[topic]

    if (!callbacks || !callbacks.length) {
      return
    }

    const promises = callbacks.map((callback) => {
      return new Promise<void>(async (resolve, reject) => {
        let committed = false

        const committer: ConsumerCommitCallback = async (commit = true) => {
          committed = true

          if (this.config.autoCommit) {
            return resolve()
          }

          if (commit) {
            const offset = (Number(message.offset) + 1).toString()
            await this.consumer.commitOffsets([{ topic, partition, offset }])
          }

          resolve()
        }

        try {
          await callback(result, committer, heartbeat, pause)
        } catch (error) {
          this.handleError(topic, error)
          resolve()
        }

        if (!committed) {
          if (this.config.autoCommit) {
            resolve()
          } else {
            reject(new Error('Expected commit() to be called as autoCommit is false'))
          }
        }
      })
    })

    await Promise.all(promises)
  }

  async start() {
    if (!this.#started) {
      await this.consumer.connect()

      await this.consumer.run({
        autoCommit: this.config.autoCommit,
        autoCommitInterval: this.config.autoCommitInterval,
        autoCommitThreshold: this.config.autoCommitThreshold,
        eachBatchAutoResolve: this.config.eachBatchAutoResolve,
        partitionsConsumedConcurrently: this.config.partitionsConsumedConcurrently,
        eachMessage: this.eachMessage.bind(this),
      })

      this.#started = true
    }

    return this
  }

  async stop() {
    if (this.#started) {
      await this.consumer.disconnect()
    }

    return this
  }

  async on(subscription: ConsumerSubscribeTopics, callback: ConsumerCallback): Promise<void>
  async on(subscription: ConsumerSubscribeTopic, callback: ConsumerCallback): Promise<void>
  async on(
    subscription: ConsumerSubscribeTopic & ConsumerSubscribeTopics,
    callback: ConsumerCallback
  ) {
    if (typeof callback !== 'function') {
      throw new TypeError('Consumer callback is not a function')
    }

    let topics = []
    if (Array.isArray(subscription.topics)) {
      topics = subscription.topics
    } else {
      topics = subscription.topic.split(',').filter((topic) => !!topic)
    }

    topics.forEach(async (item) => {
      const events = this.events[item] || []

      events.push(callback)

      this.events[item] = events

      this.topics.push(item)
    })

    await this.consumer.subscribe({
      topics,
      fromBeginning: subscription.fromBeginning ?? false,
    })
  }

  handleError(topic: string, error: Error) {
    const handlers = this.errorHandlers[topic] || []
    handlers.forEach((handler) => {
      handler(error)
    })
  }

  onError(topic: string, callback: ConsumerErrorHandler) {
    const handlers = this.errorHandlers[topic] || []
    handlers.push(callback)
    this.errorHandlers[topic] = handlers
  }
}
