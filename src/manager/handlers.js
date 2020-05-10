const { checkTag } = require('./checkTag');

const { getKafkaTwitterEvent, STREAM_EVENTS } = require('../twtKafka/twitterKafka');
const kaftwEvt = getKafkaTwitterEvent();
const { getRoomSize } = require('./../socketio/socket.helpers');

/**
 * Much Better Implementation :)
 */
class MySocket {
  constructor(socket) {
    this.socket = socket;
    this.id = socket.id;
    this.socket.join('_connected');
    this.connected = true;
    this.hashTag = null;
    console.log('CONNECTION:', this.id);
  }

  async _unsub(tag) {
    try {
      this.socket.leave(tag);
      const subs = getRoomSize(tag);
      if (subs === 0) {
        console.log(tag, 'is orphan');
        await kaftwEvt(STREAM_EVENTS.DELETE, tag);
      }
      return true;
    } catch (error) {
      console.error('UNSUB ERROR 1001:', error);
      throw new Error('ERROR 1001');
    }
  }

  async _sub(tag) {
    try {
      this.socket.join(tag);
      const subs = getRoomSize(tag);
      if (subs === 1) {
        console.log(tag, 'is new in system');
        await kaftwEvt(STREAM_EVENTS.CREATE, tag);
      }
      return true;
    } catch (error) {
      console.error('SUB ERROR 1002:', error);
      throw new Error('ERROR 1002');
    }
  }

  async disconnect() {
    console.log('DISCONNECT:', this.id, this.hashTag || '');
    const oldTag = this.hashTag;
    if (oldTag) await this._unsub(oldTag);
    this.hashTag = null;
    this.connected = false;
  }

  async newTagQuery(newTag) {
    try {
      checkTag(newTag);
      const oldTag = this.hashTag;
      if (newTag === oldTag) return;
      this.socket.emit('hashtag', { err: false, hashtag: newTag });
      if (oldTag) await this._unsub(oldTag);
      this.hashTag = newTag;
      await this._sub(newTag);
    } catch (error) {
      this.socket.emit('hashtag', { err: true, msg: error.message });
      console.log('NEW TAG QUERY', error);
    }
  }
}

const createSocket = (socket) => {
  const xx = new MySocket(socket);
  return xx;
};

module.exports = { createSocket };
