import { io } from 'socket.io-client';

// Replace with your actual backend URL
// const socketUrl = 'https://cool-lions-cut.loca.lt';
//const socketUrl = 'http://34.47.214.154:5000';
  const socketUrl = 'https://subodh.live:5000';
const socket = io(socketUrl, {
    transports: ['websocket'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
});

export default socket;

