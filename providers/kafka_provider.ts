import { ApplicationService, KafkaConfig } from '@adonisjs/core/types'

import { Kafka } from '../src/index.ts'

export default class KafkaProvider {
  private app: ApplicationService

  constructor(app: ApplicationService) {
    this.app = app
  }

  register() {
    this.app.container.singleton('kafka', async () => {
      const logger = await this.app.container.make('logger')
      const config = this.app.config.get<KafkaConfig>('kafka')
      return new Kafka(logger, config)
    })
  }

  async boot() {
    const kafka = await this.app.container.make('kafka')
    await kafka.start()
  }

  async shutdown() {
    const kafka = await this.app.container.make('kafka')
    await kafka.disconnect()
  }
}
