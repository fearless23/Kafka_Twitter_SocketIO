const Kafka = require('node-rdkafka');
const { getConfigs, getEvents } = require('./kafkaConfig');
const { conf, topic } = getConfigs();
const EVENTS = getEvents('consumer');

const c = { ...conf };
c['group.id'] = 'kafka-consumer';
const consumer = new Kafka.KafkaConsumer(c, {});

console.log('BROKERS:', c['metadata.broker.list']);
console.log('CONSUMER CONNECTING');
consumer.connect();

consumer.on(EVENTS.ready, (info, metadata) => {
  console.log(`CONSUMER ${info.name} READY`);
  // console.log('METADATA');
  // console.log(metadata);
  console.log(`TOPIC: ${topic}`);
  consumer.subscribe([topic]);
  setInterval(() => {
    consumer.consume(10);
  }, 1000);
});

consumer.on(EVENTS.data, (data) => {
  console.log(data.value.toString());
});

consumer.on(EVENTS.connectionFailure, (err) => {
  console.log('PRODUCER CONNECTION FAILURE:');
  console.log(err);
});

// consumer.on(EVENTS.log, (log) => {
//   console.log('LOG:');
//   console.log(log);
// });
