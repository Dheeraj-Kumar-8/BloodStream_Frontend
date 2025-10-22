import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? undefined;

export const getSocket = () => socket;

export const connectSocket = () => {
  if (socket) return socket;
  socket = io(SOCKET_URL ?? window.location.origin, {
    withCredentials: true,
    transports: ['websocket'],
  });
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
