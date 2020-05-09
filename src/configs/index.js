const { getKafkaConfig, getKafkaEvents } = require('./kafka.config');
const { twitterConfig } = require('./twitter.config');

module.exports = { getKafkaConfig, getKafkaEvents, twitterConfig };
