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

  test('errorHandler fn', ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })
    const handler = sinon.spy()
    consumer.onError('test', handler)
    const error = new Error('test')
    consumer.handleError('test', error)

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
    consumer.onError('topic-1', handler1)

    const handler2 = sinon.spy()
    consumer.onError('topic-2', handler2)

    const handler3 = sinon.spy()
    consumer.onError('topic-2', handler3)

    const error1 = new Error('test1')
    const error2 = new Error('test2')

    // One error handler for topic 1
    consumer.handleError('topic-1', error1)

    assert.isTrue(handler1.called)
    assert.equal(handler1.callCount, 1)

    assert.equal(handler2.callCount, 0)
    assert.equal(handler3.callCount, 0)

    assert.isTrue(handler1.calledWith(error1))

    consumer.handleError('topic-2', error2)

    // handler 1 shouldn't be called for topic-2
    assert.equal(handler1.callCount, 1)

    assert.isTrue(handler2.called)
    assert.isTrue(handler3.called)

    assert.equal(handler2.callCount, 1)
    assert.equal(handler3.callCount, 1)
    assert.isTrue(handler2.calledWith(error2))
    assert.isTrue(handler3.calledWith(error2))

    // No error handler for topic 3
    consumer.handleError('topic-3', error1)
    assert.equal(handler1.callCount, 1)
    assert.equal(handler2.callCount, 1)
    assert.equal(handler3.callCount, 1)
  })

  test('eachMessage', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test', autoCommit: false })
    const eachMessage = sinon.spy(consumer, 'eachMessage')

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

    assert.isTrue(eachMessage.called)
    assert.isTrue(eachMessage.calledWith(payload))
  })

  // technically an internal method, but still
  test('eachMessage via events', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test', autoCommit: true })
    sinon.replace(consumer.consumer, 'commitOffsets', sinon.spy())
    const callback = sinon.stub().callsArg(1)
    consumer.events['test'] = [callback]

    const message = {
      value: Buffer.from('{"foo":1}'),
      key: null,
      timestamp: '2024-05-03',
      attributes: 0,
      offset: '1',
      headers: {},
    }
    await consumer.eachMessage({
      topic: 'test',
      partition: 1,
      message,
      heartbeat: sinon.spy(),
      pause: sinon.spy(),
    })
    assert.isTrue(callback.called)
  })

  // technically an internal method, but still
  test('eachMessage null message', async ({ assert }) => {
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
    const result = await consumer.eachMessage({
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
  test('eachMessage wrong JSON', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })
    const callback = sinon.stub().callsArg(1)
    consumer.events['test'] = [callback]
    const handleError = sinon.replace(consumer, 'handleError', sinon.fake())

    const message = {
      value: Buffer.from('{.123}'),
      key: null,
      timestamp: '2024-05-03',
      attributes: 0,
      offset: '1',
      headers: {},
    }
    const result = await consumer.eachMessage({
      topic: 'test',
      partition: 1,
      message,
      heartbeat: sinon.spy(),
      pause: sinon.spy(),
    })
    assert.isFalse(callback.called)
    assert.isUndefined(result)
    assert.isTrue(handleError.called)

    assert.isTrue(handleError.calledWith('test'))
    assert.instanceOf(handleError.firstCall.args[1], SyntaxError)
  })

  // technically an internal method, but still
  test('eachMessage autocommit false', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test', autoCommit: false })
    const commitOffset = sinon.replace(consumer.consumer, 'commitOffsets', sinon.spy())
    const callback = sinon.stub().callsArgWith(1, true)
    consumer.events['test'] = [callback]

    const message = {
      value: Buffer.from('123'),
      key: null,
      timestamp: '2024-05-03',
      attributes: 0,
      offset: '1',
      headers: {},
    }
    await consumer.eachMessage({
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

  test('eachMessage autocommit false never commits', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test', autoCommit: false })
    const subscribe = sinon.replace(consumer.consumer, 'subscribe', sinon.spy())
    const commitOffset = sinon.replace(consumer.consumer, 'commitOffsets', sinon.spy())
    // Note: we are not calling the commit() function here:
    const callback = sinon.stub()

    consumer.on({ topic: 'test' }, callback)

    const message = {
      value: Buffer.from('123'),
      key: null,
      timestamp: '2024-05-03',
      attributes: 0,
      offset: '1',
      headers: {},
    }

    assert.isTrue(subscribe.called)

    assert.rejects(
      async () =>
        await consumer.eachMessage({
          topic: 'test',
          partition: 1,
          message,
          heartbeat: sinon.spy(),
          pause: sinon.spy(),
        }),
      'Expected commit() to be called as autoCommit is false'
    )

    assert.isTrue(callback.called)
    assert.isFalse(commitOffset.called)
  })

  test('eachMessage autocommit non-explicit', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test', autoCommit: true })
    const subscribe = sinon.replace(consumer.consumer, 'subscribe', sinon.spy())
    const commitOffset = sinon.replace(consumer.consumer, 'commitOffsets', sinon.spy())
    // Note: we are not calling the commit() function here:
    const callback = sinon.stub()

    consumer.on({ topic: 'test' }, callback)

    const message = {
      value: Buffer.from('123'),
      key: null,
      timestamp: '2024-05-03',
      attributes: 0,
      offset: '1',
      headers: {},
    }

    assert.isTrue(subscribe.called)

    assert.doesNotReject(
      async () =>
        await consumer.eachMessage({
          topic: 'test',
          partition: 1,
          message,
          heartbeat: sinon.spy(),
          pause: sinon.spy(),
        })
    )

    assert.isTrue(callback.called)
    assert.isFalse(commitOffset.called)
  })

  // technically an internal method, but still
  test('eachMessage with heartbeat & pause', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })
    sinon.replace(consumer.consumer, 'commitOffsets', sinon.spy())
    const callback = sinon.stub().callsFake(async function (_result, commit, heartbeat, pause) {
      await heartbeat()
      await pause()
      await commit(true)
    })
    consumer.events['test'] = [callback]

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
    await consumer.eachMessage({ topic: 'test', partition: 1, message, heartbeat, pause })
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
        // @ts-expect-error
        await consumer.on(
          {
            topic: 'test',
            fromBeginning: false,
          },
          wrongCallback
        )
    )
  })

  test('on single topic string', async ({ assert }) => {
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
        topics: ['test'],
        fromBeginning: false,
      })
    )
  })

  test('on single topic string from beginning', async ({ assert }) => {
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
            topic: 'foo',
            fromBeginning: true,
          },
          callback
        )
    )
    assert.isFalse(callback.called)
    assert.isTrue(subscribe.calledOnce)
    assert.isTrue(
      subscribe.calledWith({
        topics: ['foo'],
        fromBeginning: true,
      })
    )
  })

  test('on single topic string without from beginning', async ({ assert }) => {
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
            topic: 'foo',
          },
          callback
        )
    )
    assert.isFalse(callback.called)
    assert.isTrue(subscribe.calledOnce)
    assert.isTrue(
      subscribe.calledWith({
        topics: ['foo'],
        fromBeginning: false,
      })
    )
  })

  test('on topic string with empty elements', async ({ assert }) => {
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
        topics: ['test'],
        fromBeginning: false,
      })
    )
  })

  test('on multiple topics', async ({ assert }) => {
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
            topics: ['foo', 'bar'],
            fromBeginning: false,
          },
          callback
        )
    )
    assert.isFalse(callback.called)
    assert.isTrue(subscribe.calledOnce)
    assert.isTrue(
      subscribe.calledWith({
        topics: ['foo', 'bar'],
        fromBeginning: false,
      })
    )
  })

  test('on multiple topics from beginning', async ({ assert }) => {
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
            topics: ['foo', 'bar'],
            fromBeginning: true,
          },
          callback
        )
    )
    assert.isFalse(callback.called)
    assert.isTrue(subscribe.calledOnce)
    assert.isTrue(
      subscribe.calledWith({
        topics: ['foo', 'bar'],
        fromBeginning: true,
      })
    )
  })

  test('on callback throws', async ({ assert }) => {
    const kafkajs = new Kafkajs({
      brokers: ['asd'],
    })

    const consumer = new Consumer(kafkajs, { groupId: 'test' })
    const subscribe = sinon.replace(consumer.consumer, 'subscribe', sinon.spy())
    const handleError = sinon.replace(consumer, 'handleError', sinon.fake())
    const callback = sinon.stub().throws()

    await consumer.on(
      {
        topics: ['test'],
        fromBeginning: true,
      },
      callback
    )

    assert.isTrue(subscribe.called)

    const message = {
      value: Buffer.from('123'),
      key: null,
      timestamp: '2024-05-03',
      attributes: 0,
      offset: '1',
      headers: {},
    }

    assert.doesNotReject(async () => {
      await consumer.eachMessage({
        topic: 'test',
        partition: 1,
        message,
        heartbeat: sinon.spy(),
        pause: sinon.spy(),
      })
    })

    assert.isTrue(callback.called)
    assert.isTrue(handleError.called)
  })
})
