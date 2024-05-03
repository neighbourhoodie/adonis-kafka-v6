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
  await codemods.defineEnvVariables({ KAFKA_ENABLED: true })

  /**
   * Define environment variables validations
   */
  await codemods.defineEnvValidations({
    variables: {
      KAFKA_ENABLED: `Env.schema.boolean()`,
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
