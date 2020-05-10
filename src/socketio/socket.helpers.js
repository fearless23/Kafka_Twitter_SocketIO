const broadcast = (roomName, eventName, msg) => {
  try {
    const xx = global.socketHelpers.roomBroadcaster;
    return xx(roomName).emit(eventName, msg);
  } catch (error) {
    console.error('BRODCAST ERROR', error);
  }
};

const getRoom = (roomName) => {
  try {
    const xx = global.socketHelpers.rooms;
    return xx[roomName];
  } catch (error) {
    console.error('getRoom ERROR', error);
    throw new Error('getRoom Error');
  }
};

const getRoomSize = (roomName) => {
  const room = getRoom(roomName);
  if (!!room) return room.length;
  return 0;
};

const getRooms = () => {
  try {
    const xx = global.socketHelpers.rooms;
    return Object.keys(xx);
  } catch (error) {
    console.error('getRooms ERROR', error);
    throw new Error('getRooms Error');
  }
};

module.exports = { broadcast, getRoom, getRooms, getRoomSize };
