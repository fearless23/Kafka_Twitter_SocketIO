const io = require('socket.io');
const { runTwiiter } = require('./twitter');
// const { startProducer } = require('./../kafka/producer');

const server = io.listen(process.env.PORT, {
  cookie: false,
});

const runSockerServer = () => {
  server.sockets.on('connection', (socket) => {
    console.log(`CONNECTION: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`DISCONNECT: ${socket.id}`);
    });

    socket.on('hashtag', (hashtag) => {
      socket.emit('hashtag', { err: false, hashtag });
      runTwiiter(socket, hashtag);
      // runTwiiter(socket, hashtag, addToQueue);
    });
  });
};

const runSockerServerWithKafka = async function () {
  try {
    const addToQueue = await startProducer();
    addToQueue({ msg: 'hi' });
  } catch (error) {
    console.log('PRODUCER ERROR', error);
  }
};

// runSockerServerWithKafka();
runSockerServer();
