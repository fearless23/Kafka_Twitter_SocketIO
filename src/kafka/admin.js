const Kafka = require('node-rdkafka');
const { getConfigs } = require('./kafkaConfig');
const { conf } = getConfigs();

const c = { ...conf };
c['group.id'] = 'kafka-admin';
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
