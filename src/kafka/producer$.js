const Kafka = require('node-rdkafka');
const { getKafkaConfig } = require('../configs');
const { conf } = getKafkaConfig();

const ErrorCode = Kafka.CODES.ERRORS;
const FLUSH_TIMEOUT = 10000; // ms

class KafkaBasicProducer {
  constructor(conf, topicConf = {}, options = {}) {
    this.dying = false;
    this.dead = false;
    this.flushing = false;
    this.client = new Kafka.Producer(conf, topicConf);
    this.client.setPollInterval(100);
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
        if (err) {
          console.error(`PCE:6002 => Error connecting producer =>\n${err}`);
          reject('PCE:6002');
        }
        resolve(data);
      });
    });
  }

  async die() {
    try {
      this.dying = true;
      await this.disconnect();
      this.dead = true;
      console.log('PRODUCER DISCONNECTED ON DEMAND');
    } catch (error) {
      console.error(`PDE:6001 => Error disconnecting producer =>\n${error}`);
      throw new Error('PDE:6001');
    }
  }

  async gracefulDead() {
    await this.flush(FLUSH_TIMEOUT);
    return true;
  }

  async sendMsg(topic, message, partition = null, key = 'StormyWind', timestamp = Date.now()) {
    if (this.dying || this.dead) {
      console.error('PME:6003 ==> Connection has been dead or is dying');
      throw new Error('PME:6003');
    }
    try {
      // synchronously
      this.client.produce(topic, partition, Buffer.from(message), key, timestamp);
      return;
    } catch (err) {
      console.error('PRODUCER PRODUCE ERROR INNER', err);
      if (err.code === ErrorCode.ERR__QUEUE_FULL) {
        await this.flush(FLUSH_TIMEOUT);
      }

      throw new Error(err);
    }
  }
}

const createProducer = async (topic) => {
  const c = { ...conf };
  c['client.id'] = `kafka_${topic}_producer`;
  const xx = new KafkaBasicProducer(c);
  await xx.connect();
  return xx;
};

module.exports = { createProducer };
