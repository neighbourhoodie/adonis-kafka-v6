declare module '@ioc:Message/Kafka' {
  import Kafka from '@djpfs/kafka-adonisjs'
  const kafka: Kafka

  export default kafka
}
