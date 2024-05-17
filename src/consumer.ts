import { Kafka, Consumer as KafkaConsumer } from 'kafkajs'
import {
  type ConsumerConfig,
  type ConsumerRunConfig,
  type ConsumerSubscribeTopic,
  type EachMessagePayload,
} from 'kafkajs'

export class Consumer {
  config: ConsumerConfig
  topics: string[]
  events: any
  errorHandlers: any
  killContainer: boolean
  timeout: any = 0
  consumer: KafkaConsumer
  consumerRunConfig: ConsumerRunConfig

  constructor(kafka: Kafka, config: any) {
    this.config = config
    this.topics = []
    this.events = {}
    this.errorHandlers = {}
    this.killContainer = false
    this.timeout = null
    this.consumerRunConfig = {}

    this.consumer = kafka.consumer({ groupId: this.config.groupId })
  }

  async execute(payload: EachMessagePayload, consumerRunConfig: ConsumerRunConfig) {
    const { topic, partition, message } = payload
    let result: any
    try {
      if (!message.value) {
        return
      } // TODO Log?
      result = JSON.parse(message.value.toString())
    } catch (error) {
      this.raiseError(topic, error)
      return
    }

    const events = this.events[topic] || []

    const promises = events.map((callback: any) => {
      return new Promise<void>((resolve) => {
        callback(
          result,
          async (commit = true) => {
            if (consumerRunConfig.autoCommit) {
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

  async start(consumerRunConfig: ConsumerRunConfig = {}) {
    this.consumerRunConfig = consumerRunConfig
    await this.consumer.connect()

    await this.consumer.run({
      partitionsConsumedConcurrently: consumerRunConfig.partitionsConsumedConcurrently,
      autoCommit: consumerRunConfig.autoCommit,
      eachMessage: async ({ topic, partition, message, heartbeat, pause }: EachMessagePayload) =>
        this.execute({ topic, partition, message, heartbeat, pause }, consumerRunConfig),
    })
  }

  async on({ topic, fromBeginning }: ConsumerSubscribeTopic, callback: any) {
    const callbackFn = this.resolveCallback(callback)
    if (!callbackFn) {
      throw new Error('no callback specified or cannot find your controller method')
    }

    if (topic instanceof RegExp) {
      throw new Error('regexp topic not supported by adonis-kafka yet')
    }

    let topicArray = [topic]

    if (typeof topic === 'string') {
      topicArray = topic.split(',')
    }

    topicArray.forEach(async (item: any) => {
      if (!item) {
        return
      }

      const events = this.events[item] || []

      events.push(callbackFn)

      this.events[item] = events

      this.topics.push(item)

      await this.consumer.subscribe({
        topic: item,
        fromBeginning: fromBeginning,
      })
    })
  }

  raiseError(topic: string, error: Error) {
    const handlers = this.errorHandlers[topic] || []
    handlers.forEach((handler: any) => {
      handler(error)
    })
  }

  registerErrorHandler(topic: string, callback: any) {
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
