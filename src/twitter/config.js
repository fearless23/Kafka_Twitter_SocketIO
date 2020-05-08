const Twit = require('twit');

const ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
const ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET;
const API_KEY = process.env.TWIITER_API_KEY;
const API_SECRET_KEY = process.env.TWITTER_API_SECRET_KEY;
const APP_ID = process.env.TWIITER_APP_ID;

const Twitter = new Twit({
  consumer_key: API_KEY,
  consumer_secret: API_SECRET_KEY,
  access_token: ACCESS_TOKEN,
  access_token_secret: ACCESS_TOKEN_SECRET,
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
  // app_only_auth: true,
});

module.exports = { Twitter };
