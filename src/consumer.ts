import { Kafka, Consumer as KafkaConsumer } from 'kafkajs'
import { type ConsumerConfig, type EachMessagePayload } from 'kafkajs'

import type {
  ConsumerCallback,
  ConsumerClassMethod,
  ConsumerRunConfig,
  ConsumerSubscribeTopic,
} from './types.ts'

export class ConsumerGroup {
  config: ConsumerConfig
  topics: string[]
  events: any
  errorHandlers: any
  killContainer: boolean
  timeout: any = 0
  consumer: KafkaConsumer
  consumerRunConfig: ConsumerRunConfig

  constructor(kafka: Kafka, config: ConsumerConfig, consumerRunConfig: ConsumerRunConfig) {
    this.config = config
    this.topics = []
    this.events = {}
    this.errorHandlers = {}
    this.killContainer = false
    this.timeout = null
    this.consumerRunConfig = consumerRunConfig

    this.consumer = kafka.consumer(this.config)
  }

  async eachMessage(payload: EachMessagePayload): Promise<void> {
    let result: any
    try {
      if (!payload.message.value) {
        return
      } // TODO Log?
      result = JSON.parse(payload.message.value.toString())
    } catch (error) {
      this.raiseError(payload.topic, error)
      return
    }

    const events = this.events[payload.topic]

    if (!events || !events.length) {
      return
    }

    const key = payload.message.key?.toString('utf-8') ?? null

    const headers: Record<string, string> = {}
    if (payload.message.headers !== undefined) {
      const payloadHeaders = payload.message.headers

      Object.keys(payloadHeaders).forEach((headerName) => {
        const header = payloadHeaders[headerName]
        if (!header) return

        headers[headerName] = header.toString('utf-8')
      }, {})
    }

    const promises = events.map((callback: ConsumerCallback) => {
      return new Promise<void>((resolve) => {
        callback({ key, value: result, headers }, async (commit = false) => {
          if (this.consumerRunConfig.autoCommit) {
            return resolve()
          }

          if (commit) {
            const offset = (Number(payload.message.offset) + 1).toString()
            await this.consumer.commitOffsets([
              {
                topic: payload.topic,
                partition: payload.partition,
                offset,
              },
            ])
          }

          resolve()
        })
      })
    })

    await Promise.all(promises)
  }

  async start() {
    await this.consumer.connect()

    await this.consumer.run({
      ...this.consumerRunConfig,
      eachMessage: this.eachMessage.bind(this),
    })
  }

  async on({ topic, fromBeginning }: ConsumerSubscribeTopic, callback: ConsumerCallback) {
    const callbackFn = this.resolveCallback(callback)
    if (!callbackFn) {
      throw new Error('no callback specified or cannot find your controller method')
    }

    console.info({ topic, callback })

    let topicArray = [topic]

    if (typeof topic === 'string') {
      topicArray = topic.split(',').filter((item) => !!item)
    }

    topicArray.forEach(async (item) => {
      const events = this.events[item] || []

      events.push(callbackFn)

      this.events[item] = events

      this.topics.push(item)
    })

    await this.consumer.subscribe({
      topics: topicArray,
      fromBeginning: fromBeginning,
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

  resolveCallback(callback: ConsumerCallback | ConsumerClassMethod) {
    if (Array.isArray(callback)) {
      const [ControllerClass, fn] = callback
      const controller = new ControllerClass()
      if (typeof controller[fn] === 'function') {
        return controller[fn].bind(controller) as ConsumerCallback
      }
    }

    if (typeof callback === 'function') {
      return callback
    }

    return null
  }
}
