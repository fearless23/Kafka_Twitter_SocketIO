const { createStream } = require('./Twitter_Stream');
const { createProducer } = require('../kafka/producer$');
const { createConsumer } = require('../kafka/consumer$');
const { USER_EVENTS } = require('../manager/hashtag.manager');
const STREAM_EVENTS = {
  DELETE: 'DELETE',
  CREATE: 'CREATE',
  BROADCAST: 'CREATE',
};

const addToKafka = (tStream, producer, hashtag) => {
  tStream.getTweet().subscribe((tweet) => {
    producer.sendMsg(hashtag, JSON.stringify(tweet), null, `#${hashtag}`).catch((error) => {
      console.error('addToKafka', error);
    });
  });
};

const takeFromKafka = (consumer, brodcast) => {
  consumer.startFetching(1);
  consumer.getMsgs().subscribe((msg) => {
    brodcast({ err: false, tweet: JSON.parse(msg) });
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
      const consumer = await createConsumer(hashtag);
      const producer = await createProducer(hashtag);
      this.streams.set(hashtag, tStream);
      this.consumers.set(hashtag, consumer);
      this.producers.set(hashtag, producer);
      return { tStream, producer, consumer };
    } catch (error) {
      console.error('ERROR CREATING STREAMS FOR:', hashtag, error);
      throw new Error(`ERROR CREATING STREAMS FOR ${hashtag}`);
    }
  }

  async _createNewProducer(hashtag, userEvent) {
    const { tStream, producer, consumer } = await this._createStreams(hashtag);
    console.log('STREAM STARTING ==>', hashtag);
    addToKafka(tStream, producer, hashtag);
    await consumer.subscribe([hashtag]);
    const brodcast = (msg) => userEvent(USER_EVENTS.BROADCAST, hashtag, 'tweet', msg);
    takeFromKafka(consumer, brodcast);
  }

  _getStreams(hashtag) {
    const producer = this.producers.get(hashtag);
    const consumer = this.consumers.get(hashtag);
    const tStream = this.streams.get(hashtag);
    return { tStream, producer, consumer };
  }

  _deleteStreams(hashtag) {
    this.producers.delete(hashtag);
    this.consumers.delete(hashtag);
    this.streams.delete(hashtag);
  }

  async _stopProducer(hashtag) {
    const { tStream, producer, consumer } = this._getStreams(hashtag);

    await consumer.die();
    tStream.stop();
    await producer.die();

    this._deleteStreams(hashtag);
  }

  async newHashTag(hashtag, userEvent) {
    try {
      const tagExists = this.hashTags.has(hashtag);
      if (!tagExists) {
        this.hashTags.add(hashtag);
        await this._createNewProducer(hashtag, userEvent);
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

  // NEW CLIENT OLD HASHTAG
  async broadcast(hashtag, userEvent) {
    await consumer.subscribe([hashtag]);
    const brodcast = (msg) => userEvent(USER_EVENTS.BROADCAST, hashtag, 'tweet', msg);
    takeFromKafka(consumer, brodcast);
  }

  event(eventName, ...args) {
    switch (eventName) {
      case STREAM_EVENTS.CREATE:
        return this.newHashTag(...args);

      case STREAM_EVENTS.DELETE:
        return this.stopHashTag(...args);

      case STREAM_EVENTS.BROADCAST:
        return this.brodcast(...args);

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
