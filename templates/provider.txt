import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import Kafka from '@djpfs/kafka-adonisjs'

export default class KafkaProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {
    this.app.container.singleton('Message/Kafka', () => {
      const Logger = this.app.container.resolveBinding('Adonis/Core/Logger')
      const env = this.app.container.resolveBinding('Adonis/Core/Env')

      return new Kafka(Logger, env)
    })
  }

  public boot() {
    const Config = this.app.container.resolveBinding('Adonis/Core/Env')
    if (String(Config.get('KAFKA_ENABLED')) === 'true') {
      this.app.container.use('Message/Kafka').start()
    }
  }

  public async shutdown() {
    const Config = this.app.container.resolveBinding('Adonis/Core/Env')
    if (String(Config.get('KAFKA_ENABLED')) === 'true') {
      this.app.container.use('Message/Kafka').disconnect()
    }
  }
}
