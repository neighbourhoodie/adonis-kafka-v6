/*
import { test } from '@japa/runner'
import * as sinon from 'sinon'

import { Consumer } from '../src/consumer.ts'
import { Kafka as Kafkajs } from 'kafkajs'
process.env['KAFKAJS_NO_PARTITIONER_WARNING'] = '1'
test.group('Kafka Consumer', (group) => {
  group.each.teardown(async () => {
    sinon.restore()
  })

  test('instantiate', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })
    const consumer = sinon.spy(kafkajs, 'consumer')
    new Consumer(kafkajs, { groupId: 'test' })
    assert.isTrue(consumer.called)
  })

  test('start', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })
    const connect = sinon.replace(consumer.consumer, 'connect', sinon.fake())
    const run = sinon.replace(consumer.consumer, 'run', sinon.fake())
    await consumer.start()

    assert.isTrue(connect.called)
    assert.equal(connect.callCount, 1)
    assert.isTrue(run.called)
    assert.equal(run.callCount, 1)
  })

  // technically this is a private method, just doing this as an exercise for now
  test('resolveCallback: fn', ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })
    const callback = sinon.spy()
    const resolved = consumer.resolveCallback(callback)
    assert.equal(callback, resolved)
  })

  // technically this is a private method, just doing this as an exercise for now
  test('resolveCallback: method', ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })
    class Foo {
      callback() {}
    }

    const resolved = consumer.resolveCallback([Foo, 'callback'])
    assert.equal(resolved.name, 'bound callback')
  })

  // technically this is a private method, just doing this as an exercise for now
  test('resolveCallback: wrong', ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })
    const resolved = consumer.resolveCallback(123)
    assert.isNull(resolved)
  })

  test('errorHandler fn', ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })
    const handler = sinon.spy()
    consumer.registerErrorHandler('test', handler)
    const error = new Error('test')
    consumer.raiseError('test', error)

    assert.isTrue(handler.called)
    assert.equal(handler.callCount, 1)
    assert.isTrue(handler.calledWith(error))
  })

  test('errorHandler fns', ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })

    const handler1 = sinon.spy()
    consumer.registerErrorHandler('test1', handler1)
    const error1 = new Error('test1')

    const handler2 = sinon.spy()
    consumer.registerErrorHandler('test2', handler2)
    const error2 = new Error('test2')

    const handler3 = sinon.spy()
    consumer.registerErrorHandler('test3', handler3)
    const error3 = new Error('test3')

    consumer.raiseError('test1', error1)
    consumer.raiseError('test2', error2)
    consumer.raiseError('test3', error3)

    assert.isTrue(handler1.called)
    assert.equal(handler1.callCount, 1)
    assert.isTrue(handler1.calledWith(error1))

    assert.isTrue(handler2.called)
    assert.equal(handler2.callCount, 1)
    assert.isTrue(handler2.calledWith(error2))

    assert.isTrue(handler3.called)
    assert.equal(handler3.callCount, 1)
    assert.isTrue(handler3.calledWith(error3))
  })

  test('eachMessage', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })
    // const callback = sinon.stub().callsArg(1)
    // consumer.events['test'] = [callback]

    const runConfig = {
      autoCommit: true,
    }

    consumer.consumerRunConfig = runConfig

    const execute = sinon.spy(consumer, 'execute')

    const message = {
      value: Buffer.from('{"foo":1}'),
      key: null,
      timestamp: '2024-05-03',
      attributes: 0,
      offset: '1',
      headers: {},
    }

    const payload = {
      topic: 'test',
      partition: 1,
      message,
      heartbeat: sinon.spy(),
      pause: sinon.spy(),
    }

    await consumer.eachMessage(payload)

    assert.isTrue(execute.called)
    assert.isTrue(execute.calledWith(payload))
  })

  // technically an internal method, but still
  test('execute', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })
    sinon.replace(consumer.consumer, 'commitOffsets', sinon.spy())
    const callback = sinon.stub().callsArg(1)
    consumer.events['test'] = [callback]
    consumer.consumerRunConfig = {
      autoCommit: true,
    }
    const message = {
      value: Buffer.from('{"foo":1}'),
      key: null,
      timestamp: '2024-05-03',
      attributes: 0,
      offset: '1',
      headers: {},
    }
    await consumer.execute({
      topic: 'test',
      partition: 1,
      message,
      heartbeat: sinon.spy(),
      pause: sinon.spy(),
    })
    assert.isTrue(callback.called)
  })

  // technically an internal method, but still
  test('execute null message', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })
    const callback = sinon.stub().callsArg(1)
    consumer.events['test'] = [callback]

    const message = {
      value: null,
      key: null,
      timestamp: '2024-05-03',
      attributes: 0,
      offset: '1',
      headers: {},
    }
    const result = await consumer.execute({
      topic: 'test',
      partition: 1,
      message,
      heartbeat: sinon.spy(),
      pause: sinon.spy(),
    })
    assert.isFalse(callback.called)
    assert.isUndefined(result)
  })

  // technically an internal method, but still
  test('execute wrong JSON', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })
    const callback = sinon.stub().callsArg(1)
    consumer.events['test'] = [callback]
    const handler = sinon.spy()
    consumer.registerErrorHandler('test', handler)

    const message = {
      value: Buffer.from('{.123}'),
      key: null,
      timestamp: '2024-05-03',
      attributes: 0,
      offset: '1',
      headers: {},
    }
    const result = await consumer.execute({
      topic: 'test',
      partition: 1,
      message,
      heartbeat: sinon.spy(),
      pause: sinon.spy(),
    })
    assert.isFalse(callback.called)
    assert.isUndefined(result)
    assert.isTrue(handler.called)
    assert.isTrue(handler.args[0][0] instanceof SyntaxError)
  })

  // technically an internal method, but still
  test('execute autocommit false', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })
    const commitOffset = sinon.replace(consumer.consumer, 'commitOffsets', sinon.spy())
    const callback = sinon.stub().callsArgWith(1, true)
    consumer.events['test'] = [callback]
    consumer.consumerRunConfig = {
      autoCommit: false,
    }
    const message = {
      value: Buffer.from('123'),
      key: null,
      timestamp: '2024-05-03',
      attributes: 0,
      offset: '1',
      headers: {},
    }
    await consumer.execute({
      topic: 'test',
      partition: 1,
      message,
      heartbeat: sinon.spy(),
      pause: sinon.spy(),
    })
    assert.isTrue(callback.called)
    assert.isTrue(commitOffset.called)
    assert.isTrue(
      commitOffset.calledWith([
        {
          topic: 'test',
          partition: 1,
          offset: '2', // incremented +1 from what we passed in above
        },
      ])
    )
  })

  // technically an internal method, but still
  test('execute with heartbeat & pause', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })
    sinon.replace(consumer.consumer, 'commitOffsets', sinon.spy())
    const callback = sinon.stub().callsFake(async function (_result, commit, payload) {
      await payload.heartbeat()
      await payload.pause()
      await commit(true)
    })
    consumer.events['test'] = [callback]
    consumer.consumerRunConfig = {
      autoCommit: true,
    }
    const message = {
      value: Buffer.from('123'),
      key: null,
      timestamp: '2024-05-03',
      attributes: 0,
      offset: '1',
      headers: {},
    }
    const heartbeat = sinon.spy()
    const pause = sinon.spy()
    await consumer.execute({ topic: 'test', partition: 1, message, heartbeat, pause })
    assert.isTrue(heartbeat.called)
    assert.isTrue(pause.called)
  })

  test('on wrong fn', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })
    const wrongCallback = 123
    assert.rejects(
      async () =>
        await consumer.on(
          {
            topic: 'test',
            fromBeginning: false,
          },
          wrongCallback
        )
    )
  })

  test('on no RegExp', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })
    const wrongCallback = sinon.spy()
    assert.rejects(
      async () =>
        await consumer.on(
          {
            topic: /foo/,
            fromBeginning: false,
          },
          wrongCallback
        )
    )
    assert.isFalse(wrongCallback.called)
  })

  test('on topic string', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })
    const subscribe = sinon.replace(consumer.consumer, 'subscribe', sinon.spy())
    const callback = sinon.spy()
    assert.doesNotReject(
      async () =>
        await consumer.on(
          {
            topic: 'test',
            fromBeginning: false,
          },
          callback
        )
    )
    assert.isFalse(callback.called)
    assert.isTrue(subscribe.calledOnce)
    assert.isTrue(
      subscribe.calledWith({
        topic: 'test',
        fromBeginning: false,
      })
    )
  })

  test('on topic array weird', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })
    const subscribe = sinon.replace(consumer.consumer, 'subscribe', sinon.spy())
    const callback = sinon.spy()
    assert.doesNotReject(
      async () =>
        await consumer.on(
          {
            topic: 'test,,',
            fromBeginning: false,
          },
          callback
        )
    )
    assert.isFalse(callback.called)
    assert.isTrue(subscribe.calledOnce)
    assert.isTrue(
      subscribe.calledWith({
        topic: 'test',
        fromBeginning: false,
      })
    )
  })
})
*/
