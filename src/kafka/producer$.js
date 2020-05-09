const Kafka = require('node-rdkafka');
const { getKafkaConfig, getKafkaEvents } = require('../configs');
const { conf } = getKafkaConfig();
const EVENTS = getKafkaEvents('producer');

const c = { ...conf };
c['group.id'] = 'kafka-producer';

const ErrorCode = Kafka.CODES.ERRORS;
const FLUSH_TIMEOUT = 10000; // ms

class KafkaBasicProducer {
  constructor(conf, topicConf = {}, options = {}) {
    this.dying = false;
    this.dead = false;
    this.flushing = false;
    this.client = new Kafka.Producer(conf, topicConf);
    this.debug = options.debug === undefined ? false : options.debug;
  }

  disconnect() {
    return new Promise((resolve, reject) => {
      return this.client.disconnect((err, data) => {
        if (err) reject(err);
        resolve(data);
      });
    });
  }

  async flush(timeout = FLUSH_TIMEOUT) {
    if (this.flushing) return;

    this.flushing = true;
    return new Promise((resolve, reject) => {
      return this.client.flush(timeout, (err) => {
        this.flushing = false;
        if (err) reject(err);
        resolve();
      });
    });
  }

  connect(metadataOptions = {}) {
    return new Promise((resolve, reject) => {
      this.client.connect(metadataOptions, (err, data) => {
        if (err) reject(err);
        resolve(data);
      });
    });
  }

  async die() {
    this.dying = true;
    await this.disconnect();
    this.dead = true;
  }

  async gracefulDead() {
    await this.flush(FLUSH_TIMEOUT);
    return true;
  }

  async sendMsg(topic, message, partition = null, key = 'StormyWind', timestamp = Date.now()) {
    return new Promise((resolve, reject) => {
      if (this.dying || this.dead) {
        reject(new ConnectionDeadError('Connection has been dead or is dying'));
      }
      try {
        // synchronously
        this.client.produce(topic, partition, Buffer.from(message), key, timestamp);
        resolve('MSG SEND TO KAFKA');
      } catch (err) {
        if (err.code === ErrorCode.ERR__QUEUE_FULL) {
          // flush all queued messages
          return this.flush(FLUSH_TIMEOUT).then(() => {
            resolve();
          });
        }
        reject(err);
      }
    });
  }
}

const createProducer = async () => {
  const xx = new KafkaBasicProducer(c);
  await xx.connect();
  return xx;
};

module.exports = { createProducer };
