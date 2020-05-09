const io = require('socket.io');
const { runTwitter } = require('../twitter/runTwitter');
const { createProducer } = require('../kafka/producer$');




const runSocketServer = (producer) => {
  const server = io.listen(process.env.PORT, {
    cookie: false,
  });
  server.sockets.on('connection', (socket) => {
    console.log(`CONNECTION: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`DISCONNECT: ${socket.id}`);
    });

    socket.on('hashtag', (hashtag) => {
      socket.emit('hashtag', { err: false, hashtag });
      runTwitter(hashtag, producer);
    });
  });
};

const runWithKafka = async function () {
  try {
    const producer = await createProducer();
    console.log('PRODUCER CONNECTED');
    runSocketServer(producer);
  } catch (error) {
    console.log('PRODUCER ERROR', error);
  }
};

runWithKafka();
