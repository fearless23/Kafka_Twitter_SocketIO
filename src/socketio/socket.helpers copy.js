// const helpers = global.socketHelpers;

const broadcast = (broadcaster) => (roomName, eventName, msg) => {
  try {
    const xx = broadcaster;

    console.log(typeof xx)
    const y = xx(roomName)
    const zz = y.emit(eventName, msg);
    return zz
  } catch (error) {
    console.error('BRODCAST ERROR', error);
    // throw new Error('Brodcast Error');
  }
};

const getRoom = (globalRooms) => (roomName) => {
  try {
    const xx = globalRooms;
    return xx[roomName];
  } catch (error) {
    console.error('getRoom ERROR', error);
    throw new Error('getRoom Error');
  }
};

const getRoomSize = () => (roomName) => {
  const room = getRoom(roomName);
  if (!!room) return room.length;
  return 0;
};

const getRooms = (globalRooms) => {
  try {
    const xx = globalRooms;
    return Object.keys(xx);
  } catch (error) {
    console.error('getRooms ERROR', error);
    throw new Error('getRooms Error');
  }
};

module.exports = { broadcast, getRoom, getRooms, getRoomSize };
