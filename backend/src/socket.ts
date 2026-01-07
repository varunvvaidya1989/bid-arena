import { Server as HTTPServer } from "http";
// import socket.io without requiring types to keep dev deps minimal
const { Server: IOServer } = require('socket.io');

let io: any = null;

export function initSocket(server: HTTPServer) {
  io = new IOServer(server, { cors: { origin: '*' } });
  io.on('connection', (socket: any) => {
    console.log('socket connected', socket.id);
    socket.on('disconnect', () => console.log('socket disconnected', socket.id));
  });
  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
