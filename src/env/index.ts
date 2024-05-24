/**
 * This is used to validate the start/env.ts for Kafka Brokers
 */
interface Validators {
  brokers(): (key: string, value?: string) => string[]
}

interface KafkaEnv {
  schema: Validators
}

export const KafkaEnv: KafkaEnv = {
  schema: {
    brokers() {
      return (name: string, value?: string): string[] => {
        if (!value) {
          throw new Error(`value for $${name} is required`)
        }

        const urls = value.split(',')
        const valid = urls.every((url) => {
          return URL.canParse(url)
        })

        if (!valid) {
          throw new Error(`Invalid URLs in $${name}`)
        }

        return urls
      }
    },
  },
}
