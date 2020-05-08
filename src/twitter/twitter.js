const { Subject } = require('rxjs');
const { Twitter } = require('./config');

const extractTweetData = (tweet) => {
  const { id_str, text, retweet_count, favorite_count, created_at, timestamp_ms } = tweet;
  const {
    id,
    screen_name,
    name,
    followers_count,
    friends_count,
    profile_image_url_https,
  } = tweet.user;
  return {
    time: created_at,
    timeMS: timestamp_ms,
    id: id_str,
    text,
    retweets: retweet_count,
    favorites: favorite_count,
    user: {
      screenName: '@' + screen_name,
      id: id,
      img: profile_image_url_https,
      name: name,
      followers: followers_count,
      friends: friends_count,
    },
  };
};

class TwitterStream {
  newTweet = new Subject();
  constructor(hashtag) {
    this.stream = Twitter.stream('statuses/filter', {
      track: '#' + hashtag,
      language: 'en',
    });

    this.hashtag = hashtag;

    this.getData();
  }

  getData() {
    this.stream.on('tweet', (tweet) => {
      this.newTweet.next(extractTweetData(tweet));
    });
  }

  getTweet() {
    return this.newTweet.asObservable();
  }

  stop() {
    console.log('CLEARING FOR', this.hashtag);
    this.newTweet.complete();
    this.stream.stop();
  }
}
let currStream = null;

const runTwiiter = function (socket, hashtag, addToQueue) {
  if (currStream) currStream.stop();
  currStream = new TwitterStream(hashtag);

  console.log('STREAM STARTING ==>', hashtag);
  currStream.getTweet().subscribe((tweet) => {
    console.log('GOT NEW TWEET');
    socket.emit('tweet', { err: false, tweet });
  });
};

module.exports = { runTwiiter };
