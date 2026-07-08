import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameRoom } from './rooms.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());

// ─── STATE ────────────────────────────────────────────────────────────
const rooms = new Map(); // code -> GameRoom

// ─── REST API ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

// ─── SOCKET.IO ────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[${socket.id}] Player connected`);

  // Create room
  socket.on('create-room', (data, callback) => {
    const { playerName, maxPlayers, mode, roomName } = data;
    const code = generateCode();
    const room = new GameRoom(code, playerName, maxPlayers, mode, roomName);
    rooms.set(code, room);
    room.addPlayer(socket.id, playerName, socket);
    
    socket.join(code);
    socket.emit('joined-room', { code, isHost: true, players: room.getPlayersData(), mode: room.mode, maxPlayers: room.maxPlayers, roomName: room.roomName });
    callback({ ok: true, code });
    console.log(`[${socket.id}] Created room ${code}`);
  });

  // Join room
  socket.on('join-room', (data, callback) => {
    const { code, playerName } = data;
    const room = rooms.get(code);
    
    if (!room) {
      callback({ ok: false, msg: 'Room not found' });
      return;
    }
    
    if (room.isFull()) {
      callback({ ok: false, msg: 'Room is full' });
      return;
    }
    
    room.addPlayer(socket.id, playerName, socket);
    socket.join(code);
    io.to(code).emit('player-joined', { players: room.getPlayersData(), mode: room.mode, maxPlayers: room.maxPlayers, roomName: room.roomName });
    socket.emit('joined-room', { code, isHost: false, players: room.getPlayersData(), mode: room.mode, maxPlayers: room.maxPlayers, roomName: room.roomName });
    callback({ ok: true });
    console.log(`[${socket.id}] Joined room ${code}`);
  });

  // Start game
  socket.on('start-game', (data, callback) => {
    const { code } = data;
    const room = rooms.get(code);
    
    if (!room) {
      callback({ ok: false, msg: 'Room not found' });
      return;
    }
    
    if (!room.isHost(socket.id)) {
      callback({ ok: false, msg: 'Only host can start' });
      return;
    }
    
    room.startGame();
    io.to(code).emit('game-started', room.getGameState());
    callback({ ok: true });
    console.log(`[${socket.id}] Started game in room ${code}`);
  });

  // Player action (bet, hit, stand, double)
  socket.on('player-action', (data, callback) => {
    const { code, action, value } = data;
    const room = rooms.get(code);
    
    if (!room) {
      callback({ ok: false, msg: 'Room not found' });
      return;
    }
    
    const result = room.executeAction(socket.id, action, value);
    io.to(code).emit('game-state-updated', room.getGameState());
    callback(result);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[${socket.id}] Player disconnected`);
    
    // Remove player from rooms
    for (const [code, room] of rooms) {
      if (room.removePlayer(socket.id)) {
        if (room.getPlayerCount() === 0) {
          rooms.delete(code);
          console.log(`[${socket.id}] Deleted empty room ${code}`);
        } else {
          io.to(code).emit('player-left', { players: room.getPlayersData(), mode: room.mode, maxPlayers: room.maxPlayers, roomName: room.roomName });
        }
        break;
      }
    }
  });
});

// ─── HELPERS ──────────────────────────────────────────────────────────
function generateCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// ─── START SERVER ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🎰 Blackjack Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing service or set PORT to another value.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
