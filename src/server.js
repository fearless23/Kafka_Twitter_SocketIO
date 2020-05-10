const { server } = require('./socketio/init');
const { createSocket } = require('./manager');

server.sockets.on('connection', (socket) => {
  const ss = createSocket(socket);
  socket.on('disconnect', () => {
    ss.disconnect().catch();
  });
  socket.on('hashtag', (tag) => {
    ss.newTagQuery(tag).catch();
  });
});
