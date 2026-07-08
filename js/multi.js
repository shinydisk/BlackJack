import { showScreen, formatAmount } from './ui.js';

// Variables globales pour accès depuis main.js
let _t = (key) => key; // Sera défini par main.js
let _setMsg = (msg) => {}; // Sera défini par main.js

export function setTranslator(tFunc) {
  _t = tFunc;
}

export function setMsgFunction(msgFunc) {
  _setMsg = msgFunc;
}

// ─── SOCKET.IO CLIENT ────────────────────────────────────────────────
let socket = null;
export let currentRoom = null; // { code, isHost, players, gameState, ... }

// ─── VARIABLES DE MULTIJOUEUR ────────────────────────────────────────
let pendingPlayerName = '';
let pendingRoomName = '';
let pendingMaxPlayers = 6;
let pendingMode = 'free';

export function initSocket(serverUrl) {
  if (socket) return;

  const socketHost = window.location.hostname || 'localhost';
  const socketProto = window.location.protocol.startsWith('http') ? window.location.protocol : 'http:';
  const defaultSocketUrl = `${socketProto}//${socketHost}:4000`;
  const socketUrl = serverUrl || defaultSocketUrl;

  console.log('Socket.io connecting to:', socketUrl);
  socket = io(socketUrl, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });

  updateConnectionStatus('connecting', '🟡 Connexion...');

  socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
    updateConnectionStatus('connected', '🟢 Connecté');
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connect_error:', err);
    updateConnectionStatus('disconnected', '🔴 Erreur de connexion');
  });

  socket.on('connect_timeout', () => {
    console.warn('Socket connection timed out');
    updateConnectionStatus('disconnected', '🔴 Connexion expirée');
  });

  socket.on('joined-room', (data) => {
    currentRoom = {
      code: data.code,
      isHost: data.isHost,
      players: data.players,
      mode: data.mode || 'free',
      maxPlayers: data.maxPlayers || 6,
      roomName: data.roomName || '',
      gameState: 'waiting'
    };
    updateLobbyDisplay();
    showScreen('lobby-screen');
  });

  socket.on('player-joined', (data) => {
    if (currentRoom) {
      currentRoom.players = data.players;
      if (data.mode) currentRoom.mode = data.mode;
      if (data.maxPlayers) currentRoom.maxPlayers = data.maxPlayers;
      if (data.roomName) currentRoom.roomName = data.roomName;
      updateLobbyDisplay();
    }
  });

  socket.on('player-left', (data) => {
    if (currentRoom) {
      currentRoom.players = data.players;
      if (data.mode) currentRoom.mode = data.mode;
      if (data.maxPlayers) currentRoom.maxPlayers = data.maxPlayers;
      if (data.roomName) currentRoom.roomName = data.roomName;
      updateLobbyDisplay();
    }
  });

  socket.on('game-started', (data) => {
    currentRoom.gameState = data.gameState;
    currentRoom.dealerHand = data.dealerHand;
    currentRoom.dealerScore = data.dealerScore;
    currentRoom.playerStates = data.playerStates;
    
    // Initialiser les variables de jeu multijoueur
    showScreen('game-screen');
    
    // Build chips for multiplayer game
    const CHIP_DENOMINATIONS = [5, 10, 25, 50, 100, 1000, 10000, 100000];
    // This would need to be imported from main.js
    // For now, we'll render the game after a brief delay to ensure DOM is ready
    setTimeout(() => {
      renderMultiplayerGame();
    }, 100);
  });

  socket.on('game-state-updated', (data) => {
    currentRoom.gameState = data.gameState;
    currentRoom.dealerHand = data.dealerHand;
    currentRoom.dealerScore = data.dealerScore;
    currentRoom.playerStates = data.playerStates;
    renderMultiplayerGame();
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    currentRoom = null;
    updateConnectionStatus('disconnected', '🔴 Déconnecté');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
}

// ─── CREATE ROOM ─────────────────────────────────────────────────────
export function handleCreateRoom() {
  const roomNameInput = document.getElementById('room-name-input');
  const playerNameInput = document.getElementById('create-player-name');
  
  pendingRoomName = roomNameInput.value.trim() || '';
  pendingPlayerName = playerNameInput.value.trim() || 'Joueur';
  
  if (!pendingPlayerName) {
    alert('Veuillez entrer votre prénom');
    return;
  }
  
  if (!socket) {
    initSocket();
  }
  
  socket.emit('create-room', {
    playerName: pendingPlayerName,
    maxPlayers: pendingMaxPlayers,
    mode: pendingMode,
    roomName: pendingRoomName
  }, (response) => {
    if (!response.ok) {
      alert('Erreur : ' + response.msg);
    }
  });
}

// ─── JOIN ROOM ───────────────────────────────────────────────────────
export function handleJoinRoom() {
  const inputs = document.querySelectorAll('.code-char');
  const code = Array.from(inputs).map(i => i.value).join('').toUpperCase();
  const playerNameInput = document.getElementById('join-player-name');
  const playerName = playerNameInput.value.trim() || 'Joueur';
  
  const joinMsg = document.getElementById('join-msg');
  
  if (code.length !== 4) {
    joinMsg.textContent = '❌ ' + _t('err-code-short');
    return;
  }
  
  if (!socket) {
    initSocket();
  }
  
  socket.emit('join-room', {
    code: code,
    playerName: playerName
  }, (response) => {
    if (!response.ok) {
      joinMsg.textContent = '❌ ' + (response.msg === 'Room not found' ? 'Room non trouvée' : 'Room pleine');
    }
  });
}

// ─── START GAME ──────────────────────────────────────────────────────
export function handleLobbyStart() {
  if (!socket || !socket.connected) {
    alert('Cannot start the game: multiplayer server is not connected. Check the backend at http://localhost:4000.');
    return;
  }

  if (!currentRoom || !currentRoom.isHost) {
    alert('Only the host can start the game');
    return;
  }
  
  socket.emit('start-game', {
    code: currentRoom.code
  }, (response) => {
    if (!response.ok) {
      alert('Error: ' + response.msg);
    }
  });
}

// ─── BETTING ──────────────────────────────────────────────────────────
export function placeBetMulti(chipValue) {
  if (!currentRoom || currentRoom.gameState !== 'betting') return;
  
  socket.emit('player-action', {
    code: currentRoom.code,
    action: 'bet',
    value: chipValue
  }, (response) => {
    if (response.ok) {
      renderMultiplayerGame();
    } else {
      _setMsg(_t(response.msg) || response.msg);
    }
  });
}

export function clearBetMulti() {
  if (!currentRoom || currentRoom.gameState !== 'betting') return;
  
  socket.emit('player-action', {
    code: currentRoom.code,
    action: 'clear-bet'
  }, (response) => {
    if (response.ok) {
      renderMultiplayerGame();
    }
  });
}

export function readyMulti() {
  if (!currentRoom || currentRoom.gameState !== 'betting') return;
  
  socket.emit('player-action', {
    code: currentRoom.code,
    action: 'ready'
  }, (response) => {
    if (!response.ok) {
      _setMsg(_t(response.msg) || response.msg);
    }
  });
}

// ─── GAMEPLAY ────────────────────────────────────────────────────────
export function hitMulti() {
  if (!currentRoom || currentRoom.gameState !== 'playing') return;
  
  socket.emit('player-action', {
    code: currentRoom.code,
    action: 'hit'
  }, (response) => {
    if (!response.ok) {
      _setMsg(_t(response.msg) || response.msg);
    }
  });
}

export function standMulti() {
  if (!currentRoom || currentRoom.gameState !== 'playing') return;
  
  socket.emit('player-action', {
    code: currentRoom.code,
    action: 'stand'
  }, (response) => {
    if (!response.ok) {
      _setMsg(_t(response.msg) || response.msg);
    }
  });
}

export function doubleMulti() {
  if (!currentRoom || currentRoom.gameState !== 'playing') return;
  
  socket.emit('player-action', {
    code: currentRoom.code,
    action: 'double'
  }, (response) => {
    if (!response.ok) {
      _setMsg(_t(response.msg) || response.msg);
    }
  });
}

// ─── UI UPDATES ───────────────────────────────────────────────────────
function updateConnectionStatus(state, text) {
  const statusEl = document.getElementById('connection-status');
  const iconEl = document.getElementById('connection-icon');
  const textEl = document.getElementById('connection-text');
  
  if (statusEl) {
    statusEl.classList.toggle('connected', state === 'connected');
    statusEl.classList.toggle('disconnected', state === 'disconnected');
  }
  if (iconEl) iconEl.textContent = state === 'connected' ? '🟢' : '🔴';
  if (textEl) textEl.textContent = text;
}

function updateLobbyDisplay() {
  if (!currentRoom) return;
  
  // Code
  document.getElementById('lobby-code-display').textContent = currentRoom.code;
  
  // Mode et capacité
  const modeText = currentRoom.mode === 'timed' 
    ? '⏱ Chrono' 
    : '♾ Libre';
  document.getElementById('lobby-mode-display').textContent = modeText;
  
  const playerCount = currentRoom.players.length;
  const maxPlayers = currentRoom.maxPlayers || 6;
  document.getElementById('lobby-capacity').textContent = `${playerCount}/${maxPlayers}`;
  
  // Liste des joueurs
  const playersList = document.getElementById('lobby-players-list');
  playersList.innerHTML = '';
  for (const player of currentRoom.players) {
    const playerEl = document.createElement('div');
    playerEl.className = 'lobby-player-item';
    playerEl.innerHTML = `
      <div class="lobby-player-name">
        ${player.isHost ? '<span class="badge-host" data-i18n="badge-host">Hôte</span>' : ''}
        <span>${player.name}</span>
      </div>
      <div class="lobby-player-bank">${formatAmount(player.bank)} €</div>
    `;
    playersList.appendChild(playerEl);
  }
}

function renderMultiplayerGame() {
  if (!currentRoom) return;
  
  const gameState = currentRoom.gameState;
  const playerStates = currentRoom.playerStates || [];
  
  // Trouver le joueur actuel
  const myId = socket.id;
  const myState = playerStates.find(p => p.id === myId);
  
  if (!myState) return;
  
  // Afficher les chips si c'est la phase de mise
  if (gameState === 'betting') {
    buildChipsMulti();
  }
  
  // Afficher les cartes du dealer
  const dealerCards = document.getElementById('dealer-cards');
  dealerCards.innerHTML = '';
  if (currentRoom.dealerHand) {
    currentRoom.dealerHand.forEach((card, i) => {
      const hidden = gameState === 'betting' && i === 1;
      dealerCards.appendChild(cardElMulti(card, hidden));
    });
  }
  
  // Afficher mes cartes
  const playerCards = document.getElementById('player-cards');
  playerCards.innerHTML = '';
  if (myState.hand) {
    myState.hand.forEach(card => {
      playerCards.appendChild(cardElMulti(card, false));
    });
  }
  
  // Scores
  document.getElementById('dealer-score').textContent = gameState === 'over' 
    ? currentRoom.dealerScore 
    : '';
  document.getElementById('player-score').textContent = myState.score || '';
  
  // HUD
  updateHUDMulti(myState);
  
  // Actions
  updateActionsMulti(gameState, myState);
}

function buildChipsMulti() {
  const denominations = [5, 10, 25, 50, 100, 1000, 10000, 100000];
  const container = document.getElementById('chips-row');
  if (!container) return;
  
  container.innerHTML = '';
  for (const d of denominations) {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.textContent = formatAmount(d);
    btn.onclick = () => placeBetMulti(d);
    container.appendChild(btn);
  }
}

function updateHUDMulti(playerState) {
  document.getElementById('hud-name').textContent = playerState.name || 'Joueur';
  document.getElementById('hud-bank').textContent = formatAmount(playerState.bank) + ' €';
  document.getElementById('hud-bet').textContent = formatAmount(playerState.bet) + ' €';
  document.getElementById('bet-display').textContent = formatAmount(playerState.bet) + ' €';
}

function updateActionsMulti(gameState, playerState) {
  const btnHit = document.getElementById('btn-hit');
  const btnStand = document.getElementById('btn-stand');
  const btnDouble = document.getElementById('btn-double');
  const btnDeal = document.getElementById('btn-deal');
  const btnClear = document.getElementById('btn-clear');
  
  if (gameState === 'betting') {
    btnHit.disabled = true;
    btnStand.disabled = true;
    btnDouble.disabled = true;
    btnDeal.disabled = false;
    btnClear.disabled = false;
  } else if (gameState === 'playing') {
    btnHit.disabled = playerState.busted || playerState.ready;
    btnStand.disabled = playerState.busted || playerState.ready;
    btnDouble.disabled = playerState.busted || playerState.ready || playerState.hand.length !== 2;
    btnDeal.disabled = true;
    btnClear.disabled = true;
  } else if (gameState === 'over') {
    btnHit.disabled = true;
    btnStand.disabled = true;
    btnDouble.disabled = true;
    btnDeal.disabled = false;
    btnClear.disabled = true;
  }
}

// ─── CARD ELEMENT (copie simplifiée de ui.js) ────────────────────────
const RED_SUITS = ['♥', '♦'];

function cardElMulti(card, hidden = false) {
  const d = document.createElement('div');
  const isRed = RED_SUITS.includes(card.s);
  let cls = 'card ' + (hidden ? 'hidden' : (isRed ? 'red' : 'black'));
  d.className = cls;
  if (hidden) {
    d.innerHTML = '<div class="card-top"> </div><div class="card-suit"> </div><div class="card-bot"> </div>';
  } else {
    d.innerHTML = `<div class="card-top">${card.v}</div><div class="card-suit">${card.s}</div><div class="card-bot">${card.v}</div>`;
  }
  return d;
}

export function handleGameStartedMulti() {
  renderMultiplayerGame();
}
export function handleChipMulti(value) {
  placeBetMulti(value);
}

export function handleClearBetMulti() {
  clearBetMulti();
}

export function handleDealMulti() {
  readyMulti();
}

export function handleHitMulti() {
  hitMulti();
}

export function handleStandMulti() {
  standMulti();
}

export function handleDoubleMulti() {
  doubleMulti();
}

// ─── MODE SELECTION ───────────────────────────────────────────────────
export function selectMode(mode) {
  pendingMode = mode;
  
  document.getElementById('seg-timed').classList.toggle('active', mode === 'timed');
  document.getElementById('seg-free').classList.toggle('active', mode === 'free');
}

export function adjustPlayerCount(delta) {
  pendingMaxPlayers = Math.max(2, Math.min(10, pendingMaxPlayers + delta));
  document.getElementById('player-count-val').textContent = pendingMaxPlayers;
}

// ─── COPY CODE ───────────────────────────────────────────────────────
export function copyCode() {
  if (!currentRoom) return;
  
  navigator.clipboard.writeText(currentRoom.code).then(() => {
    const btn = document.getElementById('btn-copy');
    const original = btn.textContent;
    btn.textContent = '✓';
    setTimeout(() => {
      btn.textContent = original;
    }, 2000);
  });
}
