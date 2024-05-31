import { test } from '@japa/runner'

import { IgnitorFactory } from '@adonisjs/core/factories'
import { Kafka } from '../src/index.ts'
import sinon from 'sinon'
import { Producer } from '../src/producer.ts'
import { ConsumerGroup } from '../src/consumer_group.ts'

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

    const producer = kafkaService.createProducer('test')
    assert.instanceOf(producer, Producer)

    const consumerGroup = kafkaService.createConsumerGroup({
      groupId: 'test',
      autoCommit: false,
    })
    assert.instanceOf(consumerGroup, ConsumerGroup)

    const consumerStart = sinon.spy(consumerGroup, 'start')
    const producerStart = sinon.spy(producer, 'start')

    const producerConnect = sinon.replace(producer.producer, 'connect', sinon.fake())

    const consumerConnect = sinon.replace(consumerGroup.consumer, 'connect', sinon.fake())
    const consumerRun = sinon.replace(consumerGroup.consumer, 'run', sinon.fake())

    let started = false
    await app.start(async () => {
      started = true
    })

    assert.isTrue(started, 'Application started')

    assert.isTrue(producerStart.called)
    assert.isTrue(producerConnect.called, 'consumer connect is called')

    assert.isTrue(consumerStart.called)
    assert.isTrue(consumerConnect.called, 'consumer connect is called')
    assert.isTrue(consumerRun.called, 'consumer run is called')

    assert.equal(producerStart.callCount, 1)
    assert.equal(consumerStart.callCount, 1)

    const consumerStop = sinon.spy(consumerGroup, 'stop')
    const consumerDisconnect = sinon.replace(consumerGroup.consumer, 'disconnect', sinon.fake())
    const producerStop = sinon.spy(producer, 'stop')
    const producerDisconnect = sinon.replace(producer.producer, 'disconnect', sinon.fake())

    const stop = sinon.spy(kafka, 'stop')

    await app.terminate()
    assert.isTrue(stop.called, 'kafka.stop called')
    assert.isTrue(consumerStop.called, 'consumer.stop called')
    assert.isTrue(producerStop.called, 'producer.stop called')

    assert.isTrue(consumerDisconnect.called, 'consumer.consumer.disconnect called')
    assert.isTrue(producerDisconnect.called, 'producer.producer.disconnect called')
  })

  test('shutdown before startup completes', async ({ assert }) => {
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

    const producer = kafka.createProducer('test')
    const consumerGroup = kafka.createConsumerGroup({
      groupId: 'test',
      autoCommit: false,
    })

    const consumerStop = sinon.spy(consumerGroup, 'stop')
    const consumerDisconnect = sinon.replace(consumerGroup.consumer, 'disconnect', sinon.fake())
    const producerStop = sinon.spy(producer, 'stop')
    const producerDisconnect = sinon.replace(producer.producer, 'disconnect', sinon.fake())

    const stop = sinon.spy(kafka, 'stop')

    await app.terminate()
    assert.isTrue(stop.called)
    assert.isTrue(consumerStop.called)
    assert.isTrue(producerStop.called)

    assert.isFalse(consumerDisconnect.called)
    assert.isFalse(producerDisconnect.called)
  })

  test('duplicate producers', async ({ assert }) => {
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
          },
        },
      })
      .create(BASE_URL)

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    const kafka = await app.container.make('kafka')

    assert.doesNotReject(() => kafka.createProducer('test'))
    assert.rejects(() => kafka.createProducer('test'))
  })
})
