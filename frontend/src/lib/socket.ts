import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from './config';

const SOCKET_URL = BACKEND_URL;

let socket: Socket | null = null;

export function getSocket(token?: string): Socket {
  const authToken =
    token ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('chess_token') || undefined
      : undefined);

  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      auth: authToken ? { token: authToken } : undefined,
    });
  } else {
    if (authToken && socket.auth) {
      socket.auth = { token: authToken };
    } else if (authToken) {
      socket.auth = { token: authToken };
    }
    if (!socket.connected) {
      socket.connect();
    }
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
