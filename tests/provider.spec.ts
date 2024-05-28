import { test } from '@japa/runner'

import { IgnitorFactory } from '@adonisjs/core/factories'
import { Kafka } from '../src/index.ts'
import sinon from 'sinon'
import { Producer } from '../src/producer.ts'
import { ConsumerGroup } from '../src/consumer.ts'

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

    assert.isTrue(app.container.hasBinding('kafka'))

    const kafka = await app.container.make('kafka')
    assert.instanceOf(kafka, Kafka)

    const { default: kafkaService } = await import('../services/kafka.ts')
    assert.instanceOf(kafkaService, Kafka)

    const producer = kafkaService.createProducer('test', {})
    assert.instanceOf(producer, Producer)

    const consumer = kafkaService.createConsumerGroup({
      groupId: 'test',
    })
    assert.instanceOf(consumer, ConsumerGroup)

    const disconnect = sinon.replace(kafka, 'disconnect', sinon.fake())

    await app.terminate()
    assert.isTrue(disconnect.called)
  })
})
