const { ClientManager } = require('./client.manager');

const cm = new ClientManager();

const USER_EVENTS = {
  NEW_HASHTAG_QUERY: 'NEW_HASHTAG_QUERY',
  SOCKET_DISCONNECTED: 'SOCKET_DISCONNECTED',
  BROADCAST: 'BROADCAST',
};

class TagManager {
  constructor() {
    this.hashtags = new Set();
    this.tagMap = new Map(); //{ "coding": [1,3,4], "corona": [6,8,9]}
  }

  _tagExist(tag) {
    return this.hashtags.has(tag);
  }

  _addClientIDToTag(tag, id) {
    const currIDs = this.tagMap.get(tag);
    currIDs.add(id);
    this.tagMap.set(tag, currIDs);
  }

  _deleteClientIDFromTag(tag, id) {
    const currIDs = this.tagMap.get(tag);
    currIDs.delete(id);
    this.tagMap.set(tag, currIDs);
    return currIDs.size;
  }

  _createNewTag(tag) {
    this.hashtags.add(tag);
    this.tagMap.set(tag, new Set());
  }

  // 1: EVENT = CLIENT_EVENTS.NEW_HASHTAG_QUERY
  _newHashTagQuery(newSocket, newHashtag) {
    const { isNewClient, isNewTag, oldTag } = cm.newHashTagQuery(newSocket, newHashtag);

    let globallyNewTag = null;
    let emptyTag = null;

    if (!this._tagExist(newHashtag)) {
      this._createNewTag(newHashtag);
      globallyNewTag = newHashtag;
    }

    if (isNewClient) this._addClientIDToTag(newHashtag, newSocket.id);

    if (!isNewClient && isNewTag) {
      const remIds = this._deleteClientIDFromTag(oldTag, newSocket.id);
      if (remIds === 0) {
        emptyTag = oldTag;
        this.hashtags.delete(emptyTag);
        this.tagMap.delete(emptyTag);
      }
      this._addClientIDToTag(newHashtag, newSocket.id);
    }

    return { newTag: globallyNewTag, emptyTag };
  }

  // 2: EVENT = CLIENT_EVENTS.SOCKET_DISCONNECTED
  _clientDisconnected(oldSocketID) {
    const { oldTag } = cm.clientDisconnected(oldSocketID);
    if (!oldTag) return { emptyTag: null, oldTag };
    const remIds = this._deleteClientIDFromTag(oldTag, oldSocketID);
    if (remIds === 0) {
      this.hashtags.delete(oldTag);
      this.tagMap.delete(oldTag);
      return { emptyTag: oldTag, oldTag };
    }
    return { emptyTag: null, oldTag };
  }

  // BROADCAST
  _broadcast(hashtag, event, msg) {
    const tagExists = this.hashtags.has(hashtag);
    if (!tagExists) return { err: true, msg: 'Tag do not exist in Manager' };
    global.socketRoomSend(roomName).emit(event, msg);
    const myRoom = global.socketRooms[roomName];
    console.log('BROADCASTING TO', myRoom.size, 'clients');
  }

  event(eventType, ...args) {
    switch (eventType) {
      case USER_EVENTS.NEW_HASHTAG_QUERY:
        return this._newHashTagQuery(...args);

      case USER_EVENTS.SOCKET_DISCONNECTED:
        return this._clientDisconnected(...args);

      case USER_EVENTS.BROADCAST:
        return this._broadcast(...args);

      default:
        throw new Error('Wrong EVENT TYPE');
    }
  }
}

const getUserEvent = () => {
  const xx = new TagManager();
  return xx.event.bind(xx);
};

module.exports = { getUserEvent, USER_EVENTS };
