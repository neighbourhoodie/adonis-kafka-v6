import { test } from '@japa/runner'
import * as sinon from 'sinon'

import { Producer } from '../src/producer.ts'
import { Kafka as Kafkajs } from 'kafkajs'
process.env['KAFKAJS_NO_PARTITIONER_WARNING'] = '1'

test.group('Kafka Producer', (group) => {
  group.each.teardown(async () => {
    sinon.restore()
  })

  test('instantiate', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })
    const enabled = true
    const producer = sinon.spy(kafkajs, 'producer')
    new Producer(kafkajs, {}, enabled)
    assert.isTrue(producer.called)
  })

  test('start', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const enabled = true
    const producer = new Producer(kafkajs, {}, enabled)
    const connect = sinon.replace(producer.producer, 'connect', sinon.fake())
    await producer.start()

    assert.isTrue(connect.called)
    assert.equal(connect.callCount, 1)
  })

  test('start disabled', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const enabled = false
    const producer = new Producer(kafkajs, {}, enabled)
    const connect = sinon.replace(producer.producer, 'connect', sinon.fake())
    await producer.start()

    assert.isFalse(connect.called)
  })

  test('send disabled', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const enabled = false
    const producer = new Producer(kafkajs, {}, enabled)
    const send = sinon.replace(producer.producer, 'send', sinon.fake())

    const result = await producer.send('foo', 'bar')
    assert.isUndefined(result)
    assert.isFalse(send.called)
  })

  test('send wrong type', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const enabled = true
    const producer = new Producer(kafkajs, {}, enabled)
    const send = sinon.replace(producer.producer, 'send', sinon.fake())

    assert.rejects(async () => producer.send('foo', 123))
    assert.isFalse(send.called)
  })

  test('send single message', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const enabled = true
    const producer = new Producer(kafkajs, {}, enabled)
    const send = sinon.replace(producer.producer, 'send', sinon.fake())

    await producer.send('foo', { bar: 'baz' })
    assert.isTrue(send.calledWith({ topic: 'foo', messages: [{ value: '{"bar":"baz"}' }] }))
  })

  test('send single non-string message', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const enabled = true
    const producer = new Producer(kafkajs, {}, enabled)
    const send = sinon.replace(producer.producer, 'send', sinon.fake())

    await producer.send('foo', { value: 123 })
    assert.isTrue(send.calledWith({ topic: 'foo', messages: [{ value: '123' }] }))
  })

  test('send multiple messages', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const enabled = true
    const producer = new Producer(kafkajs, {}, enabled)
    const send = sinon.replace(producer.producer, 'send', sinon.fake())

    await producer.send('foo', [{ value: 123 }, { bar: 'baz' }])
    assert.isTrue(
      send.calledWith({ topic: 'foo', messages: [{ value: '123' }, { value: '{"bar":"baz"}' }] })
    )
  })
})
