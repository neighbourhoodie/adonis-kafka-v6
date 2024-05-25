import { Kafka, Producer as KafkaProducer, type ProducerConfig } from 'kafkajs'

import { SendMessage } from './types.ts'

export class Producer {
  producer: KafkaProducer
  #started: boolean

  constructor(kafka: Kafka, config: ProducerConfig) {
    this.producer = kafka.producer(config)
    this.#started = false
  }

  async start() {
    if (!this.#started) {
      await this.producer.connect()
    }

    return this
  }

  async send(topic: string, message: SendMessage) {
    if (typeof message.value !== 'string') {
      message.value = JSON.stringify(message.value)
    }

    return await this.producer.send({
      topic,
      messages: [message],
    })
  }

  async sendMany(topic: string, messages: SendMessage[]) {
    messages = messages.map((message) => {
      if (typeof message.value !== 'string') {
        message.value = JSON.stringify(message.value)
      }

      return message
    })

    return await this.producer.send({
      topic,
      messages,
    })
  }
}
