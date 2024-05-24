import { Kafka, Producer as KafkaProducer, type ProducerConfig } from 'kafkajs'

export class Producer {
  config: ProducerConfig
  producer: KafkaProducer

  constructor(kafka: Kafka, config: ProducerConfig) {
    this.config = config
    this.producer = kafka.producer()
  }

  async start() {
    await this.producer.connect()
    return this
  }

  async send(topic: string, data: any) {
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
