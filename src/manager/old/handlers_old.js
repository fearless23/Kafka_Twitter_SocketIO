const { getKafkaTwitterEvent, STREAM_EVENTS } = require('../../twtKafka/twitterKafka');
const { getUserEvent, USER_EVENTS, checkTag } = require('..');
const userEvent = getUserEvent();
const kaftwEvt = getKafkaTwitterEvent();

const handleDisconnect = (socket) => async () => {
  try {
    console.log(`DISCONNECT: ${socket.id}`);
    const { emptyTag, oldTag } = userEvent(USER_EVENTS.SOCKET_DISCONNECTED, socket.id);
    if (oldTag) {
      const room = server.sockets.adapter.rooms[oldTag];
      console.log('TAG DISCONNECTED', oldTag, room);
      // await kaftwEvt(STREAM_EVENTS.DELETE, emptyTag);
    }
    if (emptyTag) {
      const room = server.sockets.adapter.rooms[emptyTag];
      console.log('A TAG IS EMPTY NOW', emptyTag, room);
      // await kaftwEvt(STREAM_EVENTS.DELETE, emptyTag);
    }
  } catch (error) {
    console.error('DISCONNECTION ERROR: ', error);
  }
};

const handleNewTagQuery = (socket) => async (hashtag) => {
  try {
    checkTag(hashtag);
    socket.join(hashtag);
    socket.emit('hashtag', { err: false, hashtag });
    const { newTag, emptyTag } = userEvent(USER_EVENTS.NEW_HASHTAG_QUERY, socket, hashtag);
    if (emptyTag) {
      // Disconnect Kafka Producer, Kafka Consumer and Stop Twitter Stream
      console.log('TAG HAS NO SUBSCRIBERS', emptyTag);
      // await kaftwEvt(STREAM_EVENTS.DELETE, emptyTag);
    }
    if (newTag) {
      console.log('NEW TAG IN SYSTEM DETECTED', hashtag);
      // await kaftwEvt(STREAM_EVENTS.CREATE, hashtag, userEvent);
    }
  } catch (error) {
    console.error('ERROR HERE', error);
    socket.emit('hashtag', { err: true, msg: 'Error with hashtag' });
  }
};

class MySocket {
  constructor(socket) {
    this.socket = socket;
    this.id = socket.id;
    this.connected = true;
    this.hashTag = null;
    console.log("CONNECTION:", this.id)
  }

  disconnect() {
    console.log("DISCONNECT", this.id, this.hashTag)
    if (this.hashTag) this.socket.leave(this.hashtag);
    this.connected = false;
  }

  newTagQuery(newTag) {
    if (newTag === this.hashTag) return;
    this.socket.leave(this.hashTag);
    this.socket.join(newTag);
    this.hashTag = newTag;
    console.log("NEWTAG", this.id, this.hashTag)
  }
}

const createSocket = (socket) => {
  const xx = new MySocket(socket);
  return xx;
};

module.exports = { handleDisconnect, handleNewTagQuery, createSocket };
