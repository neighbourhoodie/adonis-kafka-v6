## Instructions

add the following code to your `env.ts` file:

```typescript
  KAFKA_ENABLED: Env.schema.boolean(),
  KAFKA_CLIENT_ID: Env.schema.string(),
  KAFKA_GROUP_ID: Env.schema.string(),
  KAFKA_URL: Env.schema.string(),
  KAFKA_PORT: Env.schema.string(),
  KAFKA_FROM_BEGINNING: Env.schema.boolean(),
```

in the end the code should be similar to this:

```typescript
import Env from '@ioc:Adonis/Core/Env'

export default Env.rules({
  HOST: Env.schema.string({ format: 'host' }),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  APP_NAME: Env.schema.string(),
  DRIVE_DISK: Env.schema.enum(['local'] as const),
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  KAFKA_ENABLED: Env.schema.boolean(),
  KAFKA_CLIENT_ID: Env.schema.string(),
  KAFKA_GROUP_ID: Env.schema.string(),
  KAFKA_URL: Env.schema.string(),
  KAFKA_PORT: Env.schema.string(),
  KAFKA_FROM_BEGINNING: Env.schema.boolean(),
})
```

inside your `.env` file, you can add the following configuration by editing with your information:

```bash
KAFKA_ENABLED=true
KAFKA_CLIENT_ID=adonis-kafka
KAFKA_GROUP_ID=adonis-kafka-group
KAFKA_URL=kafka
KAFKA_PORT=9092
KAFKA_FROM_BEGINNING=true
```

now we can use create a kafka consumer and producer inside the `start/kafka.ts`.

if you kafka is running and the configurations in `.env` are correctly, everything should work fine.
