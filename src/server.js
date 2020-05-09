const io = require('socket.io');
const { getKafkaTwitterEvent, STREAM_EVENTS } = require('./twtKafka/twitterKafka');
const { getUserEvent, USER_EVENTS } = require('./manager');
const userEvent = getUserEvent();
const kaftwEvt = getKafkaTwitterEvent();

// HEROKU WILL LOAD THEIR PORT AUTOMATICALLY in ENV
const port = process.env.PORT || 3000;

const server = io.listen(port, { cookie: false });

server.sockets.on('connection', (socket) => {
  // console.log(`CONNECTION: ${socket.id}`);

  socket.on('disconnect', async () => {
    try {
      console.log(`DISCONNECT: ${socket.id}`);
      const { emptyTag } = userEvent(USER_EVENTS.SOCKET_DISCONNECTED, socket.id);
      if (emptyTag) {
        console.log('A TAG IS EMPTY NOW', emptyTag);
        await kaftwEvt(STREAM_EVENTS.DELETE, emptyTag);
      }
    } catch (error) {
      console.error('DISCONNECTION ERROR: ', error);
    }
  });

  socket.on('hashtag', async (hashtag) => {
    socket.emit('hashtag', { err: false, hashtag });
    try {
      const { newTag, emptyTag } = userEvent(USER_EVENTS.NEW_HASHTAG_QUERY, socket, hashtag);
      if (emptyTag) {
        // Disconnect Kafka Producer, Kafka Consumer and Stop Twitter Stream
        console.log('TAG HAS NO SUBSCRIBERS', emptyTag);
        await kaftwEvt(STREAM_EVENTS.DELETE, emptyTag);
      }
      if (newTag) {
        console.log('NEW TAG IN SYSTEM DETECTED', hashtag);
        await kaftwEvt(STREAM_EVENTS.CREATE, hashtag, userEvent);
      }
    } catch (error) {
      console.error('ERROR HERE', error);
    }
  });
});
