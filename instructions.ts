import { join } from 'node:path'
import * as sinkStatic from '@adonisjs/sink'
import { ApplicationService  } from '@adonisjs/core/types'

function getStub(path: string) {
  return join(__dirname, 'templates', path)
}

function makeConfig(projectRoot: string, app: ApplicationService, sink: typeof sinkStatic) {
  const configPath = app.makePath('config/kafka.ts')
  const kafkaConfig = new sink.files.MustacheFile(projectRoot, configPath, getStub('config.txt'))

  if (kafkaConfig.exists()) {
    sink.logger.action('skip').succeeded(configPath)
    return
  }
  kafkaConfig.commit()
  sink.logger.action('create').succeeded(configPath)
}

function makeContract(projectRoot: string, app: ApplicationService, sink: typeof sinkStatic) {
  const contractsPath = app.makePath('contracts/kafka.ts')
  const kafkaContract = new sink.files.MustacheFile(
    projectRoot,
    contractsPath,
    getStub('contract.txt')
  )

  if (kafkaContract.exists()) {
    sink.logger.action('skip').succeeded('contracts/kafka.ts')
    return
  }
  kafkaContract.commit()
  sink.logger.action('create').succeeded('contracts/kafka.ts')
}

function makeStart(projectRoot: string, app: ApplicationService, sink: typeof sinkStatic) {
  const startPath = app.makePath('start/kafka.ts')
  const kafkaStart = new sink.files.MustacheFile(projectRoot, startPath, getStub('start.txt'))

  if (kafkaStart.exists()) {
    sink.logger.action('skip').succeeded('start/kafka.ts')
    return
  }
  kafkaStart.commit()
  sink.logger.action('create').succeeded('start/kafka.ts')
}

function makeProvider(projectRoot: string, app: ApplicationService, sink: typeof sinkStatic) {
  const providerPath = app.makePath('providers/KafkaProvider.ts')
  const kafkaStart = new sink.files.MustacheFile(projectRoot, providerPath, getStub('provider.txt'))

  if (kafkaStart.exists()) {
    sink.logger.action('skip').succeeded('providers/KafkaProvider.ts')
    return
  }
  kafkaStart.commit()
  sink.logger.action('create').succeeded('providers/KafkaProvider.ts')
}

export default async function instructions(
  projectRoot: string,
  app: ApplicationService,
  sink: typeof sinkStatic
) {
  makeConfig(projectRoot, app, sink)
  makeContract(projectRoot, app, sink)
  makeStart(projectRoot, app, sink)
  makeProvider(projectRoot, app, sink)
}
