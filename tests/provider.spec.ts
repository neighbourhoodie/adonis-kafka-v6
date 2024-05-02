import { test } from '@japa/runner'

import { IgnitorFactory } from '@adonisjs/core/factories'
import { Kafka } from '../src/index.ts'

const BASE_URL = new URL('./tmp/', import.meta.url)

process.env['KAFKAJS_NO_PARTITIONER_WARNING'] = '1'

test.group('Kafka Provider', () => {
  test('register kafka provider', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [() => import('../providers/kafka_provider.ts')],
        },
      })
      .withCoreConfig()
      .withCoreProviders()
      .merge({
        config: {
          kafka: {
            groupId: '123',
            url: 'localhost:1234',
            clientId: '123',
            brokers: ['localhost:1232'],
            enabled: false,
          },
        },
      })
      .create(BASE_URL)

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    assert.instanceOf(await app.container.make('kafka'), Kafka)
  })
})
