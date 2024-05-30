import { schema } from '@poppinss/validator-lite'

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
          throw new Error(`Missing environment variable "${name}"`)
        }

        const hostValidator = schema.string({
          format: 'host',
          message: `Value for environment variable "${name}" must only contain valid domain or ip addresses, instead received "${value}"`,
        })

        const portValidator = schema.number()

        const urls = value.split(',')
        urls.every((url) => {
          if (!url.includes(':')) {
            throw new Error(
              `Value for environment variable "${name}" must include both hostnames and port numbers, instead received ${value}`
            )
          }

          const [hostname, port] = url.split(':', 2)

          hostValidator(name, hostname)
          portValidator(name, port)
        })

        return urls
      }
    },
  },
}
