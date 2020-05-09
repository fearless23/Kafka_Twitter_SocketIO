const { createStream } = require('./Twitter_Stream');
const { createProducer } = require('../kafka/producer$');
const { createConsumer } = require('../kafka/consumer$');
const { USER_EVENTS } = require('../manager/hashtag.manager');
const STREAM_EVENTS = {
  DELETE: 'DELETE',
  CREATE: 'CREATE',
};

const addToKafka = (tStream, producer, hashtag) => {
  tStream.getTweet().subscribe(async (tweet) => {
    try {
      const msg = await producer.sendMsg(hashtag, JSON.stringify(tweet), null, `#${hashtag}`);
      console.log(msg);
    } catch (error) {
      console.error('SEND TO KAFKA ERROR', error);
      // REST WILL CONTINUE
    }
  });
};

const takeFromKafka = (consumer, brodcast) => {
  consumer.startFetching(1);
  consumer.msgs.subscribe((msg) => {
    brodcast(JSON.parse(msg));
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
      const consumer = await createConsumer();
      const producer = await createProducer();
      this.streams.set(hashtag, tStream);
      this.consumers.set(hashtag, consumer);
      this.producers.set(hashtag, producer);
      return [tStream, producer, consumer];
    } catch (error) {
      console.error('ERROR CREATING STREAMS FOR:', hashtag, error);
      throw new Error(`ERROR CREATING STREAMS FOR ${hashtag}`);
    }
  }

  async _createNewProducer(hashtag, userEvent) {
    const [tStream, producer, consumer] = await this._createStreams(hashtag);
    console.log('STREAM STARTING ==>', hashtag);
    addToKafka(tStream, producer, hashtag);
    await consumer.subscribe([hashtag]);
    const brodcast = (msg) => userEvent(USER_EVENTS.BROADCAST, hashtag, 'tweet', msg);
    takeFromKafka(consumer, brodcast);
  }

  async _stopProducer(hashtag) {
    const producer = this.producers.get(hashtag);
    const consumer = this.producers.get(hashtag);
    const stream = this.streams.get(hashtag);
    await consumer.disconnect();
    await producer.disconnect();
    stream.stop();
  }

  async newHashTag(hashtag, userEvent) {
    const tagExists = this.hashTags.has(hashtag);
    if (!tagExists) {
      this.hashTags.add(hashtag);
      await this._createNewProducer(hashtag, userEvent);
    }
  }
  async stopHashTag(hashtag) {
    const tagExists = this.hashTags.has(hashtag);
    console.log('KAFKA_TWIITER_LOG: ', hashtag, 'EXISTS:', tagExists);
    if (tagExists) {
      await this._stopProducer(hashtag);
      this.hashTags.delete(hashtag);
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
