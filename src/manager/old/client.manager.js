const createClient = (id, socket, hashtag) => ({ id, socket, hashtag });

const match = (a, b) => a === b;

class ClientManager {
  constructor() {
    this.clients = new Set();
    this.clientsMap = new Map();
  }

  // SET OR UPDATE CLIENT
  _addClient(socket, hashtag) {
    this.clientsMap.set(socket.id, createClient(socket.id, socket, hashtag));
  }

  _deleteClient(id) {
    this.clients.delete(id);
    this.clientsMap.delete(id);
  }

  _doClientExist(id) {
    return this.clients.has(id);
  }

  // 1: EVENT = USER_EVENTS.NEW_HASHTAG_QUERY
  newHashTagQuery(newSocket, newTag) {
    const newID = newSocket.id;
    const isNewClient = !this._doClientExist(newID);
    if (isNewClient) {
      this.clients.add(newID);
      this._addClient(newSocket, newTag);
      socket.join(newHashTag);
      return { isNewClient, isNewTag: true, newTag, oldTag: null };
    }

    const oldTag = this.clientsMap.get(newID).hashtag;
    const isNewTag = newTag !== oldTag;
    if (isNewTag) {
      socket.leave(oldTag);
      socket.join(newTag);
      this._addClient(newSocket, newTag);
    }
    return { isNewClient, isNewTag, newTag, oldTag };
  }

  // 2: EVENT = USER_EVENTS.SOCKET_DISCONNECTED
  clientDisconnected(oldSocketID) {
    const clientExist = this._doClientExist(oldSocketID);
    if (clientExist) {
      const oldTag = this.clientsMap.get(oldSocketID).hashtag;
      this._deleteClient(oldSocketID);
      return { oldTag };
    }
    return { oldTag: null };
  }
}

module.exports = { ClientManager };
