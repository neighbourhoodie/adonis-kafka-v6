import app from '@adonisjs/core/services/app'
import { Kafka } from '../src/index.js'

let kafka: Kafka

/**
 * Returns a singleton instance of the Kafka manager from the
 * container
 */
await app.booted(async () => {
  kafka = await app.container.make('kafka')
})

export { kafka as default }
