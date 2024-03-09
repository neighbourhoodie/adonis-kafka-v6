// import app from '@adonisjs/core/services/app'
import app from '@adonisjs/core/services/app'
import { Kafka } from '../src/index.ts'

let kafka: Kafka

/**
 * Returns a singleton instance of the Kafka manager from the
 * container
 */
console.log('a-k services main app', app)

await app.booted(async () => {
  console.log('a-k services main app booted')
  kafka = await app.container.make('kafka')
})

export { kafka as default }
