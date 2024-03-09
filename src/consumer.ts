import { Kafka, Consumer as KafkaConsumer } from 'kafkajs'
import { KafkaConfig } from '@adonisjs/core/types'

export class Consumer {
  config: KafkaConfig
  topics: string[]
  events: any
  killContainer: boolean
  timeout: any = 0
  consumer: KafkaConsumer

  constructor(kafka: Kafka, config: any) {
    this.config = config
    this.topics = []
    this.events = {}
    this.killContainer = false
    this.timeout = null

    this.consumer = kafka.consumer({ groupId: this.config.groupId })
  }

  async execute({ topic, partition, message }: { topic: string; partition: number; message: any }) {
    const result = JSON.parse(message.value.toString())

    const events = this.events[topic] || []

    const promises = events.map((callback: any) => {
      return new Promise<void>((resolve) => {
        callback(result, async (commit = true) => {
          if (this.config.autoCommit) {
            return resolve()
          }

          if (commit) {
            const offset = (Number(message.offset) + 1).toString()
            await this.consumer.commitOffsets([{ topic, partition, offset }])
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
      partitionsConsumedConcurrently: this.config.partitionsConcurrently,
      autoCommit: this.config.autoCommit,
      eachMessage: async ({ topic, partition, message }: any) =>
        this.execute({ topic, partition, message }),
    })
  }

  async on(topic: any, callback: any) {
    const callbackFn = this.resolveCallback(callback)
    if (!callbackFn) {
      throw new Error('no callback specified or cannot find your controller method')
    }

    let topicArray = topic

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
        fromBeginning: this.config.fromBeginning,
      })
    })
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
