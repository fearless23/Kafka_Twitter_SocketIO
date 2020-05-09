const { createStream } = require('./Twitter_Stream');

let currStream = null;

const runTwitter = (hashtag, producer) => {
  if (currStream) currStream.stop();
  currStream = createStream(hashtag);

  console.log('STREAM STARTING ==>', hashtag);
  currStream.getTweet().subscribe(async (tweet) => {
    try {
      console.info('GOT NEW TWEET');
      const msg = await producer.sendMsg(hashtag, JSON.stringify(tweet), null, `#${hashtag}`);
      console.log(msg);
    } catch (error) {
      console.error('SEND MSG ERROR', error);
      // REST WILL CONTINUE
    }
  });
};

module.exports = { runTwitter };
