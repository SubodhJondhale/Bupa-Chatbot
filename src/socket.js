import { io } from 'socket.io-client';

// Replace with your actual backend URL
// const socketUrl = 'https://34.47.214.154';
 const socketUrl = 'http://localhost:5000';
const socket = io(socketUrl, {
    transports: ['websocket'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
});

export default socket;

