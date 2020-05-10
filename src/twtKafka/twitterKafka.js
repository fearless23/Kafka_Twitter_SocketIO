const { createStream } = require('./Twitter_Stream');
const { createProducer } = require('../kafka/producer$');
const { createConsumer } = require('../kafka/consumer$');
const { broadcast } = require('./../socketio/socket.helpers');

const STREAM_EVENTS = {
  DELETE: 'DELETE',
  CREATE: 'CREATE',
};

const isStrTrue = (n) => {
  if (!n) return false;
  return n.toString().toUpperCase() === 'TRUE';
};

const SHOW_LOGS = {
  PRODUCER: isStrTrue(process.env.SHOW_PRODUCER_LOGS),
  CONSUMER: isStrTrue(process.env.SHOW_CONSUMER_LOGS),
};

const addToKafka = (tStream, producer, hashtag) => {
  tStream.getTweet().subscribe((tweet) => {
    if (SHOW_LOGS.PRODUCER) console.log(`New Tweet: #${hashtag} added to KAFKA`);
    producer.sendMsg(hashtag, JSON.stringify(tweet), null, `#${hashtag}`).catch((error) => {
      console.error('addToKafka', error);
    });
  });
};

const takeFromKafka = (consumer, roomBroadcast, hashtag) => {
  consumer.startFetching(1);
  consumer.getMsgs().subscribe((msg) => {
    if (SHOW_LOGS.CONSUMER) console.log(`BROADCASTING FOR #${hashtag}`);
    roomBroadcast(msg);
  });
};

class KafkaTwitter {
  constructor() {
    this.hashTags = new Set();
    this.producers = new Map();
    this.streams = new Map();
    this.consumers = new Map();
  }

  async _createStreams(hashtag) {
    try {
      const tStream = createStream(hashtag);
      const producer = await createProducer(hashtag);
      const consumer = await createConsumer(hashtag);
      this.streams.set(hashtag, tStream);
      this.producers.set(hashtag, producer);
      this.consumers.set(hashtag, consumer);
      return { tStream, producer, consumer };
    } catch (error) {
      this._deleteStreams(hashtag);
      console.error('ERROR CREATING STREAMS FOR:', hashtag, error);
      throw new Error(`ERROR CREATING STREAMS FOR ${hashtag}`);
    }
  }

  async _createNewProducer(hashtag) {
    const { tStream, producer, consumer } = await this._createStreams(hashtag);

    console.log(`--- STREAM STARTED: ==> ${hashtag} ---`);
    addToKafka(tStream, producer, hashtag);

    await consumer.subscribe([hashtag]);
    const roomBroadcast = (msg) =>
      broadcast(hashtag, 'tweet', { err: false, tweet: JSON.parse(msg) });
    takeFromKafka(consumer, roomBroadcast, hashtag);
  }

  _getStreams(hashtag) {
    const producer = this.producers.get(hashtag);
    const consumer = this.consumers.get(hashtag);
    const tStream = this.streams.get(hashtag);
    return {
      tStream,
      producer,
      consumer,
    };
  }

  _deleteStreams(hashtag) {
    this.streams.delete(hashtag);
    this.producers.delete(hashtag);
    this.consumers.delete(hashtag);
  }

  async _stopProducer(hashtag) {
    const { tStream, producer, consumer } = this._getStreams(hashtag);
    await consumer.die();
    tStream.stop();
    await producer.die();
    this._deleteStreams(hashtag);
  }

  async newHashTag(hashtag) {
    try {
      const tagExists = this.hashTags.has(hashtag);
      if (!tagExists) {
        this.hashTags.add(hashtag);
        await this._createNewProducer(hashtag);
      }
    } catch (error) {
      console.error('ERROR CREATING STREAMS', error);
    }
  }

  async stopHashTag(hashtag) {
    try {
      const tagExists = this.hashTags.has(hashtag);
      if (tagExists) {
        console.log('KAFKA_TWIITER_STOPPING:', hashtag);
        await this._stopProducer(hashtag);
        this.hashTags.delete(hashtag);
      }
    } catch (error) {
      console.error('ERROR STOPPING STREAMS', error);
    }
  }

  event(eventName, ...args) {
    switch (eventName) {
      case STREAM_EVENTS.CREATE:
        return this.newHashTag(...args);

      case STREAM_EVENTS.DELETE:
        return this.stopHashTag(...args);

      default:
        throw new Error('WRONG STREAM_EVENT');
    }
  }
}

const getKafkaTwitterEvent = () => {
  const xx = new KafkaTwitter();
  return xx.event.bind(xx);
};

module.exports = { getKafkaTwitterEvent, STREAM_EVENTS };
