const io = require('socket.io');
// HEROKU WILL LOAD THEIR PORT AUTOMATICALLY in ENV
const port = process.env.PORT || 3000;
const opts = { cookie: false, serveClient: false };
const server = io.listen(port, opts);

console.log('----------------PORT', port, '------------');

global.socketHelpers = {
  roomBroadcaster: (x) => server.to(x),
  rooms: server.sockets.adapter.rooms,
};
module.exports = { server };
