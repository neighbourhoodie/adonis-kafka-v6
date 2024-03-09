<h2>A Kafka</a> provider for <a href="https://adonisjs.com/">AdonisJS v5</a>

</br>

<h2>
Adonis Kafka provides an easy way to start using Kafka.
</h2>

<br>
<h2><b>Installation</b></h2>

```bash
npm i @neighbourhoodie/kafka-adonisjs
```

<h2>Setup</h2>

```bash
node ace configure @neighbourhoodie/kafka-adonisjs
```

<br>
<h2>Configuration</h2>

Edit the `.env` file to match your Kafka configuration.

Edit the `config/kafka.js` file to edit the default configuration.
<br>
<br>

<h2>Usage</h2>
<h3>List topics</h3>

```js
// file: start/kafka.js
import Kafka from "@neighbourhoodie/adonis-kafka/services/kafka";

Kafka.admin.listTopics().then((topics: any[]) => {
  console.log('topics', topics);
});
```

<h3>Create topic</h3>

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

<h3>Create Consumer</h3>
Create your consumer in `start/kafka.js`. Ex:
    
```js
import Kafka from "@neighbourhoodie/adonis-kafka/services/kafka";

Kafka.on('messages', (data: any, commit: any) => {
console.log(data)
// commit(false) // For error transaction
commit() // For successful transaction
});

Kafka.consumer.start()


````

<h3>Create Producer</h3>
Create your producer in `app/Controllers/Http` for exemple, or in any other place. Ex:

```js
import Kafka from "@neighbourhoodie/adonis-kafka/services/kafka";
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class UserController {

    public async show({ params }: HttpContextContract) {
        return Kafka.send('messages', { user_id: params.id })
    }
}
````

<h3>To another commands</h3>
This package uses <a href="https://kafka.js.org/docs">KafkaJS</a>, so you can use all commands from KafkaJS. Ex:

```js
import Kafka from "@neighbourhoodie/adonis-kafka/services/kafka";

Kafka.admin.describeCluster().then((result: any) => {
  console.log('result', result);
});
```

## Based on

<ul>
<li><a href="https://kafka.js.org/">KafkaJS</a></li>
<li><a href="https://github.com/djpfs/adonis-kafka">Adonis Kafka @djpfs</a></li>
<li><a href="https://github.com/halcyon-agile/adonis-kafka">Adonis Kafka @halcyon-agile</a></li>
</ul>
