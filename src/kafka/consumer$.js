const Kafka = require('node-rdkafka');
const { getKafkaConfig } = require('../configs');
const { conf } = getKafkaConfig();
const { Subject } = require('rxjs');
const c = { ...conf };
c['group.id'] = 'kafka-producer';

const ErrorCode = Kafka.CODES.ERRORS;
const DEFAULT_CONSUME_SIZE = 100;
const DEFAULT_CONCURRENT = 100;
const DEFAULT_AUTO_COMMIT_INTERVAL = 1000; // ms

class KafkaBasicConsumer {
  constructor(conf, topicConf = {}, options = {}) {
    this.dying = false;
    this.dead = false;
    this.topics = [];
    conf['auto.commit.interval.ms'] =
      conf['auto.commit.interval.ms'] || DEFAULT_AUTO_COMMIT_INTERVAL;

    if (!conf['rebalance_cb']) {
      conf['rebalance_cb'] = (err, assignment) => {
        if (err.code === ErrorCode.ERR__ASSIGN_PARTITIONS) {
          this.consumer.assign(assignment);
          let rebalanceLog = 'consumer rebalance : ';
          for (const assign of assignment) {
            rebalanceLog += `{topic ${assign.topic}, partition: ${assign.partition}} `;
          }
        }
        if (err.code === ErrorCode.ERR__REVOKE_PARTITIONS) {
          this.consumer.unassign();
        }
      };
    }

    this.consumer = new Kafka.KafkaConsumer(conf, topicConf);

    this.intId = null;
    this.msgs = new Subject();
  }

  disconnect() {
    if (this.intId) clearInterval(this.intId);
    this.msgs.complete();
    return new Promise((resolve, reject) => {
      return this.consumer.disconnect((err, data) => {
        if (err) reject(err);

        resolve(data);
      });
    });
  }

  async connect(metadataOptions = {}) {
    return new Promise((resolve, reject) => {
      this.consumer.connect(metadataOptions, (err, data) => {
        if (err) reject(err);
        resolve(data);
      });
    });
  }

  async die() {
    this.dying = true;

    // empty topics and unsubscribe them
    this.unsubscribe();
    // disconnect from brokers
    await this.disconnect();

    this.dead = true;
  }

  async subscribe(topics) {
    this.topics = [...this.topics, ...topics];
    // synchronously
    this.consumer.subscribe(this.topics);
  }

  unsubscribe() {
    this.topics.length = 0;
    this.consumer.unsubscribe();
  }

  offsetsStore(topicPartitions) {
    if (topicPartitions.length) {
      return this.consumer.offsetsStore(topicPartitions);
    }
  }

  fetch(size = 1) {
    // This will keep going until it gets ERR__PARTITION_EOF or ERR__TIMED_OUT
    return new Promise((resolve, reject) => {
      return this.consumer.consume(size, (err, messages) => {
        if (err) return reject(err);
        resolve(messages);
      });
    });
  }

  startFetching(size = 1) {
    this.intId = setInterval(() => {
      this.consumer.consume(size);
    }, 1000);
    this.consumer.on('data', (data) => {
      this.msgs.next(data.value.toString());
    });
  }
}

// `at least once` Consumer
class KafkaALOConsumer extends KafkaBasicConsumer {
  constructor(conf, topicConf = {}, options = {}) {
    conf['enable.auto.commit'] = true;
    conf['enable.auto.offset.store'] = false;
    super(conf, topicConf, options);

    this.legacyMessages = null;
  }

  async consume(cb, options = {}) {
    // default option value
    options.size = options.size || DEFAULT_CONSUME_SIZE;
    options.concurrency = options.concurrency || DEFAULT_CONCURRENT;
    const topicPartitionMap = {};

    if (this.dying || this.dead) {
      throw new ConnectionDeadError('Connection has been dead or is dying');
    }

    const messages = this.legacyMessages || (await this.fetch(options.size));

    // get latest topicPartitions
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      const key = `${message.topic}:${message.partition}`;
      if (topicPartitionMap[key] === undefined) {
        topicPartitionMap[key] = {
          topic: message.topic,
          partition: message.partition,
          offset: message.offset,
        };
      }
    }

    if (!cb) {
      this.offsetsStore(_.values(topicPartitionMap));
      return messages;
    }

    try {
      const results = await bluebird.map(
        messages,
        async (message) => {
          const ret = await bluebird.resolve(cb(message));
          return ret;
        },
        { concurrency: options.concurrency },
      );

      this.offsetsStore(_.values(topicPartitionMap));
      this.legacyMessages = null;
      return results;
    } catch (e) {
      this.legacyMessages = messages;
      throw e;
    }
  }
}

// `At Most Once` Consumer
class KafkaAMOConsumer extends KafkaBasicConsumer {
  constructor(conf, topicConf = {}, options = {}) {
    conf['enable.auto.commit'] = true;
    conf['enable.auto.offset.store'] = true;

    super(conf, topicConf, options);
  }

  async consume(cb, options = {}) {
    // default option value
    options.size = options.size || DEFAULT_CONSUME_SIZE;
    options.concurrency = options.concurrency || DEFAULT_CONCURRENT;

    return new Promise((resolve, reject) => {
      // This will keep going until it gets ERR__PARTITION_EOF or ERR__TIMED_OUT
      return this.consumer.consume(options.size, async (err, messages) => {
        if (this.dying || this.dead) {
          reject(new ConnectionDeadError('Connection has been dead or is dying'));
        }
        if (err) {
          reject(err);
        }
        try {
          const results = await bluebird.map(
            messages,
            async (message) => {
              return await Promise.resolve(cb(message));
            },
            { concurrency: options.concurrency },
          );

          resolve(results);
        } catch (err) {
          reject(err);
        }
      });
    });
  }
}

const createConsumer = async () => {
  const xx = new KafkaBasicConsumer(c);
  await xx.connect();
  return xx;
};

module.exports = { createConsumer };
