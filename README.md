## A [Kafka](http://kafka.apache.org) provider for [AdonisJS v6](https://adonisjs.com/)

Adonis Kafka provides an easy way to start using Kafka.

### Installation

```bash
npm i @neighbourhoodie/kafka-adonisjs
```

### Setup

```bash
node ace configure @neighbourhoodie/kafka-adonisjs
```

### Configuration

Edit the `.env` file to match your Kafka configuration.

Edit the `config/kafka.js` file to edit the default configuration.

### Usage

#### Create Consumer

Create your consumer in `start/kafka.js`. Ex:

```js
import Kafka from "@neighbourhoodie/adonis-kafka/services/kafka";

const consumer = Kafka.createConsumer({ groupId: 'default'})
consumer.on({ topic: 'messages' }, (data: any, commit: any) => {
  console.log(data)
  // commit(false) // For error transaction
  commit() // For successful transaction
});

consumer.start()
}
```

Or create a kafka controller:

```shell
node ace make controller kafka/webhooks
```

```js
// app/controllers/kafka/webhooks_controller
// import Kafka from "@neighbourhoodie/adonis-kafka/services/kafka";

export default class WebhooksController {
  async handleWebhook(data: any, commit: any) {
    console.log('received in controller', data)
    commit()
  }
}
```

```js
// start/kafka.ts
import WebhooksController from '#controllers/kafka/webhooks_controller'
const consumer = Kafka.createConsumer({ groupId: 'default' })
consumer.on({ topic: 'messages' }, [WebhooksController, 'handleWebhook'])

consumer.start()
```

##### Handle Consumer Errors

```js
const consumer = Kafka.createConsumer({ groupId: 'default' })
consumer.on('messages', [WebhooksController, 'handleWebhook'])

consumer.registerErrorHandler('messsages', (error) => {
  console.log('got error!', error)
})
consumer.start()
```

##### Use Heartbeat or Pause

```js
import Kafka from "@neighbourhoodie/adonis-kafka/services/kafka";

const consumer = Kafka.createConsumer({ groupId: 'default'})
consumer.on({ topic: 'messages' }, (data: any, commit: any, { heartbeat, pause }) => {
  console.log(data)
  // I might need some extra time processing my message
  await heartbeat()
  // or pause processing for a mo
  // await pause()
  commit() // For successful transaction
});

consumer.start()
}
```

At the moment, only `JSON.parse()` errors are handled.

#### Create Producer

Create your producer in `app/Controllers/` for example, or in any other place. Ex:

```js
import Kafka from "@neighbourhoodie/adonis-kafka/services/kafka";
import type { HttpContext } from '@adonisjs/core/http'

export default class UserController {
  constructor() {
    Kafka.createProducer('myProducer', {} /* ProducerConfig */).start()
  }
  public async show({ params, kafka: { producers } }: HttpContext) {
    return producers['myProducer'].send('messages', { user_id: params.id })
  }
}
```

#### List topics

```js
// file: start/kafka.js
import Kafka from "@neighbourhoodie/adonis-kafka/services/kafka";

Kafka.admin.listTopics().then((topics: any[]) => {
  console.log('topics', topics);
});
```

#### Create topic

```js
// file: start/kafka.js
import Kafka from "@neighbourhoodie/adonis-kafka/services/kafka";

Kafka.admin.createTopics({
  topics: [
    {
      topic: 'messages',
      numPartitions: 1,
      replicationFactor: 1,
    },
  ],
  waitForLeaders: true,
}).then((result: any) => {
  console.log('result', result);
});
```

#### To another commands

This package uses [KafkaJS](https://kafka.js.org/docs), so you can use all commands from KafkaJS. Ex:

```js
import Kafka from "@neighbourhoodie/adonis-kafka/services/kafka";

Kafka.admin.describeCluster().then((result: any) => {
  console.log('result', result);
})
```

## Based on

- [KafkaJS](https://kafka.js.org/)</a>
- [Adonis Kafka @djpfs](https://github.com/djpfs/adonis-kafka)
- [Adonis Kafka @halcyon-agile](https://github.com/halcyon-agile/adonis-kafka)
