/*
|--------------------------------------------------------------------------
| Configure hook
|--------------------------------------------------------------------------
|
| The configure hook is called when someone runs "node ace configure <package>"
| command. You are free to perform any operations inside this function to
| configure the package.
|
| To make things easier, you have access to the underlying "ConfigureCommand"
| instance and you can use codemods to modify the source files.
|
*/

import ConfigureCommand from '@adonisjs/core/commands/configure'

import { stubsRoot } from './stubs/main.js'

/**
 * Configures the package
 */
export async function configure(command: ConfigureCommand) {
  const codemods = await command.createCodemods()

  /**
   * Publish config file
   */
  await codemods.makeUsingStub(stubsRoot, 'stubs/config/kafka.stub', {})
  await codemods.makeUsingStub(stubsRoot, 'stubs/start/kafka.stub', {})

  /**
   * Define environment variables
   */
  await codemods.defineEnvVariables({
    KAFKA_BROKERS: 'localhost:9092',
    KAFKA_CLIENT_ID: '// optional',
    KAFKA_GROUP_ID: '// optional',
    KAFKA_CONNECTION_TIMEOUT: '// optional',
    KAFKA_REQUEST_TIMEOUT: '// optional',
    KAFKA_LOG_LEVEL: '// optional',
  })

  /**
   * Define environment variables validations
   */
  await codemods.defineEnvValidations({
    variables: {
      KAFKA_BROKERS: `(_name, value) => {
        if (!value) {
          throw new Error('Value for $KAFKA_BROKERS is required')
        }

        const urls = value.split(',')
        const valid = urls.every((url) => {
          return URL.canParse(url)
        })

        if (!valid) {
          throw new Error('Invalid URLs in $KAFKA_BROKERS')
        }

        // Temporary whilst @neighbourhoodie/adonis-kafka internally doesn't support
        // being passed a string or array of URLs
        return urls.join(',')
      }`,
      KAFKA_CLIENT_ID: `Env.schema.string.optional()`,
      KAFKA_GROUP_ID: `Env.schema.string.optional()`,
      KAFKA_CONNECTION_TIMEOUT: `Env.schema.number.optional()`,
      KAFKA_REQUEST_TIMEOUT: `Env.schema.number.optional()`,
      KAFKA_LOG_LEVEL: `Env.schema.enum.optional(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])`,
    },
    leadingComment: 'Variables for configuring kafka package',
  })

  /**
   * Register provider
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@neighbourhoodie/adonis-kafka/kafka_provider')
  })
}
