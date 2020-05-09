const Kafka = require('node-rdkafka');
const { getKafkaConfig, getKafkaEvents } = require('../configs');
const { conf } = getKafkaConfig();
const EVENTS = getKafkaEvents('consumer');

const c = { ...conf };
c['group.id'] = 'kafka-consumer';
const consumer = new Kafka.KafkaConsumer({
  ...c,
  offset_commit_cb: function (err, topicPartitions) {
    if (err) {
      // There was an error committing
      console.error(err);
    } else {
      // Commit went through. Let's log the topic partitions
      console.log(topicPartitions);
    }
  },
});

console.log('BROKERS:', c['metadata.broker.list']);
console.log('CONSUMER CONNECTING');
consumer.connect();

consumer.on(EVENTS.ready, (info, metadata) => {
  console.log(`CONSUMER ${info.name} READY`);
  // console.log('METADATA');
  // console.log(metadata);
  console.log(`TOPIC: ${topic}`);
  consumer.subscribe([topic]);
  consumer.consume();
  // setInterval(() => {
  // }, 1000);
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
