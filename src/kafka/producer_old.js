const Kafka = require('node-rdkafka');
const { getKafkaConfig, getKafkaEvents } = require('../configs');
const { conf } = getKafkaConfig();
const EVENTS = getKafkaEvents('producer');

const c = { ...conf };
c['client.id'] = 'kafka-producer';
const producer = new Kafka.Producer(conf);

// const startProducer = () => {
const sendMsg = (msg) => {
  try {
    producer.produce(topic, null, Buffer.from(JSON.stringify(msg)), 'Stormwind', Date.now());
    console.log('MSG SEND');
  } catch (error) {
    console.error('MSG SEND ERROR', error);
  }
};
// const p = new Promise((resolve, reject) => {
console.log('BROKERS:', c['metadata.broker.list']);
console.log('PRODUCER CONNECTING');

producer.connect({}, (err, data) => {
  if (err) {
    console.log('ERR', err);
  } else {
    console.log('DATA', data);
  }
});

producer.on(EVENTS.ready, function (info, metadata) {
  console.log(`PRODUCER ${info.name} READY`);
  // console.log('METADATA');
  // console.log(metadata);
  console.log(`TOPIC: ${topic}`);
  for (let i = 0; i < 40; i++) {
    sendMsg({ msg: 'hi' });
  }
  // producer.disconnect()
  // resolve(sendMsg);
});

producer.on(EVENTS.error, function (err) {
  console.error('Error from producer');
  console.error(err);
  producer.disconnect();
  // reject(err);
});

// producer.on(EVENTS.disconnected, (data) => {
//   console.log('PRODUCER DISCONNECTED:');
//   console.log(data);
//   // reject(data);
// });

// producer.on(EVENTS.connectionFailure, (err) => {
//   console.log('PRODUCER CONNECTION FAILURE:');
//   console.log(err);
//   // reject(err);
// });

// producer.on(EVENTS.deliveryReport, (data) => {
//   console.log('DELIVERY REPORT:');
//   console.log(data);
// });

// producer.on(EVENTS.log, (log) => {
//   console.log('LOG:');
//   console.log(log);
// });
// producer.setPollInterval(100);
// });

// return p;
// };

// module.exports = { startProducer };
