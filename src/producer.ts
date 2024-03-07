import { Kafka, Producer as KafkaProducer } from 'kafkajs'
import { KafkaConfig } from '@adonisjs/core/types'

class Producer {
  config: KafkaConfig
  producer: KafkaProducer

  constructor(kafka: Kafka, config: KafkaConfig) {
    this.config = config

    this.producer = kafka.producer()
  }

  async start() {
    await this.producer.connect()
  }

  async send(topic: string, data: any) {
    if (this.config.enabled) {
      return
    }

    if (typeof data !== 'object') {
      throw new Error('You need send a json object in data argument')
    }

    let messages = Array.isArray(data) ? data : [data]
    messages = messages.map((message) => {
      if (!message.value) {
        message = {
          value: JSON.stringify(message),
        }
      }

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

export default Producer
