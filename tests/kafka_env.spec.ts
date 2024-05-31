import { test } from '@japa/runner'
import { KafkaEnv } from '../src/env/index.ts'

interface BrokersAssertion {
  input: string
  expected: string[]
  error: boolean
}

test.group('KafkaEnv', () => {
  const cases: BrokersAssertion[] = [
    { input: 'localhost:9092', error: false, expected: ['localhost:9092'] },
    {
      input:
        'b-1.example.foobar.c19.kafka.us-east-1.amazonaws.com:9096,b-2.example.foobar.c19.kafka.us-east-1.amazonaws.com:9096',
      error: false,
      expected: [
        'b-1.example.foobar.c19.kafka.us-east-1.amazonaws.com:9096',
        'b-2.example.foobar.c19.kafka.us-east-1.amazonaws.com:9096',
      ],
    },
    { input: '0.0.0.0:9092', error: false, expected: ['0.0.0.0:9092'] },
    {
      input: '172.17.0.2:9092,172.17.0.3:9092',
      error: false,
      expected: ['172.17.0.2:9092', '172.17.0.3:9092'],
    },
    {
      input: 'localhost:9092,localhost:9093',
      error: false,
      expected: ['localhost:9092', 'localhost:9093'],
    },
    // missing port:
    { input: 'localhost', error: true, expected: [] },
    { input: '0.0.0.0', error: true, expected: [] },
    // missing host
    { input: ':9092', error: true, expected: [] },
    // missing port
    { input: 'localhost:', error: true, expected: [] },
    // invalid port:
    { input: 'localhost:aaa', error: true, expected: [] },
    // empty element:
    { input: 'localhost,,', error: true, expected: [] },
  ]

  for (const testcase of cases) {
    test(`schema.brokers with "${testcase.input}" should be ${testcase.error ? 'invalid' : 'valid'}`, async ({
      assert,
    }) => {
      const key = 'KAFKA_BROKERS'
      const validator = KafkaEnv.schema.brokers()
      if (testcase.error) {
        assert.throws(() => {
          validator(key, testcase.input)
        })
      } else {
        assert.doesNotThrow(() => {
          try {
            validator(key, testcase.input)
          } catch (err) {
            console.log(err)
            throw err
          }
        })

        const result = validator(key, testcase.input)

        assert.sameMembers(result, testcase.expected)
      }
    })
  }
})
