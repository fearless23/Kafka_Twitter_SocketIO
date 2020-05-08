const Kafka = require('kafka-node');

const KafkaClient = Kafka.KafkaClient;
const Producer = Kafka.Producer;
const KeyedMessage = Kafka.KeyedMessage;

// const brokers = process.env.CLOUDKARAFKA_BROKERS;
const brokers = 'rocket.srvs.cloudkafka.com:9094';
const username = process.env.CLOUDKARAFKA_USERNAME;
const password = process.env.CLOUDKARAFKA_PASSWORD;
const topicPrefix = process.env.CLOUDKARAFKA_TOPIC_PREFIX;

console.log('BROKERS', brokers);

const opts = {
  kafkaHost: brokers,
  sasl: {
    mechanism: 'plain',
    username,
    password,
  },
  // connectTimeout: 1000 * 5,
  // requestTimeout: 1000 * 15,
};

const client = new KafkaClient(opts);
const producer = new Producer(client, { requireAcks: 1 });
const km = new KeyedMessage('key', 'message');
const topicNames = ['default', 'test'];
const topics = topicNames.map((name) => topicPrefix + name);

module.exports = { client, producer, km, topics };
