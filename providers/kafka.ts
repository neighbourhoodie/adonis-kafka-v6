import { ApplicationService } from '@adonisjs/core/types'
import Kafka from '../src/index.ts'

export default class KafkaProvider {
  private app: ApplicationService

  constructor(app: ApplicationService) {
    this.app = app
  }

  register() {
    this.app.container.singleton('Kafka', async () => {
      const logger = await this.app.container.make('logger')
      // const config = this.app.config.get<KafkaConfig>('kafka')
      const env = this.app.getEnvironment()

      return new Kafka(logger, env)
    })
  }

  boot() {
    // this.app.config
    // if (String(Config.get('KAFKA_ENABLED')) === 'true') {
    //   this.app.container.make('Kafka').start()
    // }
  }

  async shutdown() {
    // const Config = this.app.container.resolveBinding('Adonis/Core/Env')
    // if (String(Config.get('KAFKA_ENABLED')) === 'true') {
    //   this.app.container.use('Kafka').disconnect()
    // }
  }
}
