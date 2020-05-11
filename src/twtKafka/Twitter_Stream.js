const Twit = require('twit');
const { twitterConfig } = require('../configs');
const Twitter = new Twit(twitterConfig);
const { Subject } = require('rxjs');

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
  size = 0;
  constructor(hashtag) {
    this.stream = Twitter.stream('statuses/filter', {
      track: '#' + hashtag,
      language: 'en',
    });

    this.hashtag = hashtag;
    this.isStopped = false;
    this.getData();
  }

  getData() {
    this.stream.on('tweet', (tweet) => {
      if (!this.isStopped) {
        this.size++;
        this.newTweet.next(extractTweetData(tweet));
      }
    });
  }

  getTweet() {
    return this.newTweet.asObservable();
  }

  stop() {
    this.isStopped = true;
    this.newTweet.complete();
    console.log('TWITTER DISCONNECTED ON DEMAND');
    this.stream.stop();
  }
}

const createStream = (hashtag) => {
  return new TwitterStream(hashtag);
};

module.exports = { createStream };
