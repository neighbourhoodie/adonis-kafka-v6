import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import string from '@adonisjs/core/helpers/string'
import { VariableDeclarationKind } from 'ts-morph'
import { stubsRoot } from '../stubs/main.js'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class MakeProducer extends BaseCommand {
  static commandName = 'make:producer'
  static description = 'Make a new Kafka producer'
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * The name of the model file.
   */
  @args.string({ description: 'Kafka topic to producer data to' })
  declare topic: string

  /**
   * Defines if we generate the factory for the model.
   */
  @flags.string({
    name: 'producer',
    alias: 'p',
    description: 'The producer group in #start/kafka.ts',
    default: 'default',
  })
  declare producer: string

  /**
   * Execute command
   */
  async run(): Promise<void> {
    const codemods = await this.createCodemods()

    const ProducerVariable = `${this.app.generators.modelName(this.parsed.flags.producer)}Producer`
    const ProducerId = string.create(this.parsed.flags.producer).dashCase()

    await codemods.makeUsingStub(stubsRoot, 'make/producer.stub', {
      topic: this.topic,
      ProducerClass: ProducerVariable,
      entity: this.app.generators.createEntity(this.topic),
    })

    const project = await codemods.getTsMorphProject()
    if (project) {
      const startFile = await project.getSourceFileOrThrow(this.app.startPath('kafka.ts'))

      const producerDeclaration = startFile.getVariableDeclaration(ProducerVariable)
      if (!producerDeclaration) {
        // adds the following to #start/kafka.ts:
        //    export const {{ProducerVariable}} = await Kafka.createProducer('{{ProducerId}}')
        startFile.insertVariableStatement(2, {
          isExported: true,
          declarationKind: VariableDeclarationKind.Const,
          declarations: [
            {
              name: ProducerVariable,
              initializer: `await Kafka.createProducer('${ProducerId}')`,
            },
          ],
        })
      }

      await startFile.save()
    }
  }
}
