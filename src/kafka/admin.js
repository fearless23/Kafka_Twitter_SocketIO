const Kafka = require('node-rdkafka');
const { getKafkaConfig } = require('../configs');
const { conf } = getKafkaConfig();

const c = { ...conf };
c['client.id'] = 'kafka-admin';
const adminClient = Kafka.AdminClient.create(c);

adminClient.createTopic({
  topic: "test",
  num_partitions: 1,
  replication_factor: 1
}, function(err) {
  // Done!
  if(err) console.log("ADMIN ERROR\n", err)
  else console.log("TOPIC CREATED")
});
