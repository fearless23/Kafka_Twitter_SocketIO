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

const topic = "corona"

// Non-flowing mode
consumer.connect();

consumer
  .on('ready', function() {
    consumer.subscribe([topic]);
    setInterval(function() {
      consumer.consume(1);
    }, 1000);
  })
  .on('data', function(data) {
    console.log(JSON.parse(data.value.toString()));
  });

consumer.on(EVENTS.connectionFailure, (err) => {
  console.log('CoNSUMER CONNECTION FAILURE:');
  console.log(err);
});

// consumer.on(EVENTS.log, (log) => {
//   console.log('LOG:');
//   console.log(log);
// });
