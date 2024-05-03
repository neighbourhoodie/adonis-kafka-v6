import { ApplicationService, KafkaConfig } from '@adonisjs/core/types'

import { Kafka } from '../src/index.ts'
import { Producer } from '../src/producer.ts'

import { HttpContext } from '@adonisjs/core/http'

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    kafka: {
      producers: {
        [key: string]: Producer
      }
    }
  }
}

export default class KafkaProvider {
  private app: ApplicationService
  private config: KafkaConfig

  constructor(app: ApplicationService) {
    this.app = app
    this.config = this.app.config.get<KafkaConfig>('kafka')
  }

  register() {
    this.app.container.singleton('kafka', async () => {
      const logger = await this.app.container.make('logger')
      return new Kafka(logger, this.config)
    })
  }

  async boot() {
    if (this.config.enabled) {
      const kafka = await this.app.container.make('kafka')
      await kafka.start()

      HttpContext.getter(
        'kafka',
        function (this: Request) {
          return kafka
        },
        true
      )
    }
  }

  async start() {
    try {
      const startKafka = () => import(`${this.app.startPath()}/kafka.ts`)
      startKafka()
    } catch (e) {
      console.log(e)
    }
  }

  async shutdown() {
    if (this.config.enabled) {
      const kafka = await this.app.container.make('kafka')
      kafka.disconnect()
    }
  }
}
