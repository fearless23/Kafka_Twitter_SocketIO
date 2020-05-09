const createClient = (id, socket, hashtag) => {
  return {
    id,
    socket,
    hashtag,
  };
};

const match = (a, b) => {
  return a === b;
};

class ClientManager {
  constructor() {
    this.clients = new Set();
    this.clientsMap = new Map();
  }

  _addClient(socket, hashtag) {
    this.clientsMap.set(socket.id, createClient(socket.id, socket, hashtag));
  }

  _deleteClient(id) {
    this.clients.delete(id);
    this.clientsMap.delete(id);
  }

  // 1: EVENT = USER_EVENTS.NEW_HASHTAG_QUERY
  newHashTagQuery(newSocket, newHashtag) {
    const newID = newSocket.id;
    if (!this.clients.has(newID)) {
      this.clients.add(newID);
      this._addClient(newSocket, newHashtag);
      return { err: false, isNewClient: true, isNewTag: true };
    }

    const client = this.clientsMap.get(newID);
    const currHashTag = client.hashtag;
    if (newHashtag !== currHashTag) this._addClient(newSocket, newHashtag);
    return {
      err: false,
      isNewClient: false,
      isNewTag: !match(currHashTag, newHashtag),
      oldTag: currHashTag,
    };
  }

  // 2: EVENT = USER_EVENTS.SOCKET_DISCONNECTED
  clientDisconnected(oldSocketID) {
    const c = this.clients.has(oldSocketID);
    if (c) {
      const oldTag = this.clientsMap.get(oldSocketID).hashtag;
      this._deleteClient(oldSocketID);
      return { oldTag };
    }
    return { oldTag: null };
  }

  broadcast(idSet, event, msg) {
    console.log('BROADCASTING TO', idSet.size, 'clients');
    return idSet.forEach((id) => {
      if (this.clients.has(id)) {
        const { socket } = this.clientsMap.get(id);
        socket.emit(event, msg);
      }
    });
  }
}

module.exports = { ClientManager };
