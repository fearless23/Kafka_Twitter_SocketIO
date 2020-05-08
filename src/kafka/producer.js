const Kafka = require('node-rdkafka');
const { getConfigs, getEvents } = require('./kafkaConfig');
const { conf, topic } = getConfigs();
const EVENTS = getEvents('producer');

const c = { ...conf };
c['group.id'] = 'kafka-producer';
const producer = new Kafka.Producer(conf);

// const startProducer = () => {
const sendMsg = (msg) => {
  producer.produce(topic, null, Buffer.from(JSON.stringify(msg)), 'Stormwind', Date.now());
};
// const p = new Promise((resolve, reject) => {
console.log('BROKERS:', c['metadata.broker.list']);
console.log('PRODUCER CONNECTING');

producer.on(EVENTS.ready, function (info, metadata) {
  console.log(`PRODUCER ${info.name} READY`);
  // console.log('METADATA');
  // console.log(metadata);
  console.log(`TOPIC: ${topic}`);
  sendMsg({msg: "hi"})
  // resolve(sendMsg);
});

producer.on(EVENTS.error, function (err) {
  console.error('Error from producer');
  console.error(err);
  producer.disconnect()
  // reject(err);
});

producer.on(EVENTS.disconnected, (data) => {
  console.log('PRODUCER DISCONNECTED:');
  console.log(data);
  // reject(data);
});

producer.on(EVENTS.connectionFailure, (err) => {
  console.log('PRODUCER CONNECTION FAILURE:');
  console.log(err);
  // reject(err);
});

// producer.on(EVENTS.deliveryReport, (data) => {
//   console.log('DELIVERY REPORT:');
//   console.log(data);
// });

// producer.on(EVENTS.log, (log) => {
//   console.log('LOG:');
//   console.log(log);
// });
producer.setPollInterval(100);
// });

// return p;
// };

producer.connect();

// module.exports = { startProducer };
