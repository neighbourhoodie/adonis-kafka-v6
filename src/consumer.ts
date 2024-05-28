import { Kafka, Consumer as KafkaConsumer } from 'kafkajs'
import { type EachMessagePayload } from 'kafkajs'

import {
  ConsumerGroupConfig,
  ConsumerSubscribeTopics,
  ConsumerSubscribeTopic,
  ConsumerErrorHandler,
} from './types.ts'

export class Consumer {
  config: ConsumerGroupConfig
  topics: string[]
  events: any
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
    const { topic, partition, message } = payload

    let result: any
    try {
      if (!message.value) {
        return
      }
      result = JSON.parse(message.value.toString())
    } catch (error) {
      this.raiseError(topic, error)
      return
    }

    const events = this.events[topic]

    if (!events || !events.length) {
      return
    }

    const promises = events.map((callback: any) => {
      return new Promise<void>((resolve) => {
        callback(
          result,
          async (commit = true) => {
            if (this.config.autoCommit) {
              return resolve()
            }
            if (commit) {
              const offset = (Number(message.offset) + 1).toString()
              await this.consumer.commitOffsets([{ topic, partition, offset }])
            }

            resolve()
          },
          payload
        )
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

  async on(subscription: ConsumerSubscribeTopics, callback: any): Promise<void>
  async on(subscription: ConsumerSubscribeTopic, callback: any): Promise<void>
  async on(subscription: ConsumerSubscribeTopic & ConsumerSubscribeTopics, callback: any) {
    const callbackFn = this.resolveCallback(callback)
    if (!callbackFn) {
      throw new Error('no callback specified or cannot find your controller method')
    }

    let topics = []
    if (Array.isArray(subscription.topics)) {
      topics = subscription.topics
    } else {
      topics = subscription.topic.split(',').filter((topic) => !!topic)
    }

    topics.forEach(async (item) => {
      const events = this.events[item] || []

      events.push(callbackFn)

      this.events[item] = events

      this.topics.push(item)
    })

    await this.consumer.subscribe({
      topics,
      fromBeginning: subscription.fromBeginning ?? false,
    })
  }

  raiseError(topic: string, error: Error) {
    const handlers = this.errorHandlers[topic] || []
    handlers.forEach((handler) => {
      handler(error)
    })
  }

  onError(topic: string, callback: ConsumerErrorHandler) {
    //TODO add resolveCallback
    const handlers = this.errorHandlers[topic] || []
    handlers.push(callback)
    this.errorHandlers[topic] = handlers
  }

  resolveCallback(callback: any) {
    if (Array.isArray(callback)) {
      const [ControllerClass, fn] = callback
      const controller = new ControllerClass()
      if (typeof controller[fn] === 'function') {
        return controller[fn].bind(controller)
      }
    }

    if (typeof callback === 'function') {
      return callback
    }

    return null
  }
}
