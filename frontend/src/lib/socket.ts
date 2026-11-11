import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

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
