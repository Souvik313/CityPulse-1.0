import { Server } from 'socket.io';

let ioInstance = null;

export const initSocket = (server, options = {}) => {
  if (ioInstance) return ioInstance;
  ioInstance = new Server(server, {
    cors: {
      origin: true,
      methods: ['GET', 'POST']
    },
    ...options
  });

  ioInstance.on('connection', (socket) => {
    socket.on('join', (sessionId) => {
      if (!sessionId) return;
      socket.join(sessionId);
    });

    socket.on('leave', (sessionId) => {
      if (!sessionId) return;
      socket.leave(sessionId);
    });
  });

  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
};
