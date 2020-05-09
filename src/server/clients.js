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

class Clients {
  constructor() {
    this.clients = new Set();
    this.clientsMap = new Map();
  }

  addClient(socket, hashtag) {
    this.clientsMap.set(socket.id, createClient(socket.id, socket, hashtag));
  }

  newClient(newSocket, newHashtag) {
    const newID = newSocket.id;
    if (!this.clients.has(newID)) {
      this.clients.add(newID);
      addClient(newSocket, newHashtag);
      return { err: false, newClient: true, newHashTag: true };
    }

    const client = this.clientsMap.get(newID);
    const currHashTag = client.hashtag;
    if (newHashtag !== currHashTag) addClient(newSocket, newHashtag);
    return { err: false, newClient: false, newHashTag: !match(currHashTag, newHashtag) };
  }

  removeClient() {
    
  }
}
