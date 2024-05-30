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
  })

  const project = await codemods.getTsMorphProject()
  if (project) {
    const envValidationsFile = await project.getSourceFileOrThrow(command.app.startPath('env.ts'))
    const kafkaEnvModule = `${command.name}/env`

    if (!envValidationsFile.getImportDeclaration(kafkaEnvModule)) {
      envValidationsFile.addImportDeclaration({
        namedImports: ['KafkaEnv'],
        moduleSpecifier: kafkaEnvModule,
      })
    }

    await envValidationsFile.emit()
  }

  /**
   * Define environment variables validations
   */
  await codemods.defineEnvValidations({
    variables: {
      KAFKA_BROKERS: `KafkaEnv.schema.brokers()`,

      KAFKA_CLIENT_ID: `Env.schema.string.optional()`,
      KAFKA_LOG_LEVEL: `Env.schema.enum.optional(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])`,

      KAFKA_CONNECTION_TIMEOUT: `Env.schema.number.optional()`,
      KAFKA_REQUEST_TIMEOUT: `Env.schema.number.optional()`,
      KAFKA_AUTHENTICATION_TIMEOUT: `Env.schema.number.optional()`,
      KAFKA_REAUTHENTICATION_TIMEOUT: `Env.schema.number.optional()`,

      // We don't yet support AWS IAM or OAuth Bearer or custom mechanisms
      KAFKA_SECURITY_PROTOCOL: `Env.schema.enum.optional(['PLAIN', 'SSL'])`,
      KAFKA_SASL_MECHANISM: `Env.schema.enum.optional(['PLAIN', 'SCRAM-SHA-256', 'SCRAM-SHA-512'])`,
      KAFKA_SASL_USERNAME: `Env.schema.string.optional()`,
      KAFKA_SASL_PASSWORD: `Env.schema.string.optional()`,
    },
    leadingComment: `Variables for configuring ${command.name}`,
  })

  /**
   * Register provider
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider(`${command.name}/kafka_provider`)
    rcFile.addPreloadFile(`#start/kafka`)
  })
}
