const clientEvents = {
  disconnected: 'disconnected',
  ready: 'ready',
  connectionFailure: 'connection.failure',
  error: 'event.error',
  stats: 'event.stats',
  log: 'event.log',
  event: 'event.event',
  throttle: 'event.throttle',
};

const producerEvents = { ...clientEvents, deliveryReport: 'delivery-report' };

const consumerEvents = {
  data: 'data',
  rebalance: 'rebalance',
  unsubscribed: 'unsubscribed',
  unsubscribe: 'unsubscribe',
  offsetCommit: 'offset.commit',
  ...clientEvents,
};

const brokers = {
  // cloud: process.env.CLOUDKARAFKA_BROKERS.split(','),
  cloud: process.env.CLOUD_BROKERS.split(','),
  local: process.env.LOCAL_BROKERS.split(','),
};

const securityProtocols = ['plaintext', 'ssl', 'sasl_plaintext', 'sasl_ssl'];
const mechanisms = ['GSSAPI', 'PLAIN', 'SCRAM-SHA-256'];

const kafkaConfigs = {
  cloud_old: {
    // 'group.id': 'cloudkarafka-cloud',
    'metadata.broker.list': brokers.cloud,
    // 'socket.keepalive.enable': true,
    // 'security.protocol': securityProtocols[0],
    // 'sasl.mechanisms': mechanisms[1],
    'sasl.username': process.env.CLOUDKARAFKA_USERNAME,
    'sasl.password': process.env.CLOUDKARAFKA_PASSWORD,
    debug: 'generic,broker,security',
    // 'api.version.request': true,
  },

  cloud: {
    'metadata.broker.list': brokers.cloud,
    'socket.keepalive.enable': true,
    debug: 'generic,broker,security',
  },

  local: {
    'metadata.broker.list': brokers.local,
    'socket.keepalive.enable': true,
    debug: 'generic,broker,security',
  },
};

const topicsPrefixes = {
  cloud: process.env.CLOUDKARAFKA_TOPIC_PREFIX,
  local: '',
};

const events = {
  client: clientEvents,
  producer: producerEvents,
  consumer: consumerEvents,
};

const getKafkaEvents = (type) => {
  switch (type) {
    case 'consumer':
      return events.consumer;
    case 'client':
      return events.client;
    case 'producer':
      return events.producer;

    default:
      throw new Error('Type must be client|producer|consumer');
  }
};

const getKafkaConfig = () => {
  const env = process.env.CONFIG_ENV.toLowerCase() || 'local';
  if (env !== 'local' && env !== 'cloud') throw new Error('Wrong ENV');
  const conf = kafkaConfigs[env];
  return { conf, topicPrefix: topicsPrefixes[env] };
};

module.exports = { getKafkaConfig, getKafkaEvents };
