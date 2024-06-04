import { ApplicationService, KafkaConfig } from '@adonisjs/core/types'
import { ContainerProviderContract } from '@adonisjs/core/types/app'

import { Kafka } from '../src/index.ts'

export default class KafkaProvider implements ContainerProviderContract {
  private app: ApplicationService

  constructor(app: ApplicationService) {
    this.app = app
  }

  register() {
    this.app.container.singleton('kafka', async () => {
      const logger = await this.app.container.make('logger')
      const config = this.app.config.get<KafkaConfig>('kafka')
      return new Kafka(config, logger)
    })
  }

  async boot() {
    const kafka = await this.app.container.make('kafka')
    await kafka.boot()
  }

  // Has to be ready to make use of preloads:
  async ready() {
    const kafka = await this.app.container.make('kafka')
    await kafka.startProducers()
    await kafka.startConsumerGroups()
  }

  async shutdown() {
    const kafka = await this.app.container.make('kafka')
    await kafka.stop()
  }
}
