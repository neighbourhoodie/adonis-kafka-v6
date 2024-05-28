import { ConsumerCommitCallback, ConsumerPayload } from './types.ts'

export abstract class Consumer {
  abstract topic: string
  fromBeginning: boolean = false

  constructor() {}

  abstract onMessage(payload: ConsumerPayload, commit: ConsumerCommitCallback): Promise<void>
}
