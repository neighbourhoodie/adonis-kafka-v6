import { test } from '@japa/runner'
import { Level } from '@adonisjs/logger/types'
import { logLevel } from 'kafkajs'

import { toAdonisLoggerLevel, toKafkaLogLevel } from '../src/logging.js'

test.group('Logging: toAdonisLoggerLevel', () => {
  test('with logLevel.ERROR', async ({ assert }) => {
    const newLevel = toAdonisLoggerLevel(logLevel.ERROR)
    assert.equal(newLevel, 'error')
  })
  test('with logLevel.NOTHING', async ({ assert }) => {
    const newLevel = toAdonisLoggerLevel(logLevel.NOTHING)
    assert.equal(newLevel, 'error')
  })
  test('with logLevel.WARN', async ({ assert }) => {
    const newLevel = toAdonisLoggerLevel(logLevel.WARN)
    assert.equal(newLevel, 'warn')
  })
  test('with logLevel.INFO', async ({ assert }) => {
    const newLevel = toAdonisLoggerLevel(logLevel.INFO)
    assert.equal(newLevel, 'info')
  })
  test('with logLevel.DEBUG', async ({ assert }) => {
    const newLevel = toAdonisLoggerLevel(logLevel.DEBUG)
    assert.equal(newLevel, 'debug')
  })
})

test.group('Logging: toKafkaLogLevel', () => {
  test('with Level of fatal', async ({ assert }) => {
    const newLevel = toKafkaLogLevel('fatal')
    assert.equal(newLevel, logLevel.DEBUG)
  })
  test('with Level of trace', async ({ assert }) => {
    const newLevel = toKafkaLogLevel('trace')
    assert.equal(newLevel, logLevel.DEBUG)
  })
  test('with Level of debug', async ({ assert }) => {
    const newLevel = toKafkaLogLevel('debug')
    assert.equal(newLevel, logLevel.DEBUG)
  })
  test('with Level of error', async ({ assert }) => {
    const newLevel = toKafkaLogLevel('error')
    assert.equal(newLevel, logLevel.ERROR)
  })
  test('with Level of warn', async ({ assert }) => {
    const newLevel = toKafkaLogLevel('warn')
    assert.equal(newLevel, logLevel.WARN)
  })
  test('with Level of info', async ({ assert }) => {
    const newLevel = toKafkaLogLevel('info')
    assert.equal(newLevel, logLevel.INFO)
  })
  test('with Level of unknown', async ({ assert }) => {
    // unknown isn't actually a Pino.Level, hence the as cast:
    const newLevel = toKafkaLogLevel('unknown' as Level)
    assert.equal(newLevel, logLevel.NOTHING)
  })
})
