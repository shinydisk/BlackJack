import {
  setConfig, buildDeck,
  addBet, clearBet,
  startDeal, hit, doubleDown, dealerPlay,
  resolveRound, resetPhase,
  quitGame
} from './game.js';

import {
  showScreen, renderCards, updateHUD,
  showResult, hideResult,
  setMsg, setActions,
  buildChips, switchScreens, setPlayerNameHUD,
  resetGameDOM, formatAmount
} from './ui.js';

import * as M from './multi.js';

import * as G from './game.js';

const CHIP_DENOMINATIONS = [5, 10, 25, 50, 100, 1000, 10000, 100000];

// ─── INTERNATIONALISATION ────────────────────────────────────────────
let currentLang = localStorage.getItem('bj-lang') || 'fr';

const LANG = {
  fr: {
    // Topbar
    'brand-sub':       'Casino Royale — Single Deck',
    // Landing
    'landing-tagline': 'Choisissez votre table',
    'landing-solo-title': 'Solo',
    'landing-solo-desc':  'Joueur contre la maison',
    'landing-multi-title': 'Multijoueur',
    'landing-multi-desc':  "Jusqu'à 10 joueurs",
    'tag-soon':        'Sprint 2',
    // Multi menu
    'multi-tagline':      'Joue avec tes amis',
    'multi-create-title': 'Créer une Room',
    'multi-create-desc':  'Génère un code et invite tes amis',
    'multi-join-title':   'Rejoindre',
    'multi-join-desc':    'Rejoins avec un code',
    // Create room
    'create-room-title':  'Nouvelle Room',
    'label-room-name':    'Nom de la room',
    'ph-room-name':       'Optionnel...',
    'label-max-players':  'Joueurs max',
    'label-game-mode':    'Mode de jeu',
    'mode-timed-title':   'Chrono',
    'mode-timed-desc':    '30s mise · 25s jeu',
    'mode-free-title':    'Libre',
    'mode-free-desc':     'Aucune limite',
    'btn-create-room':    'Créer la Room',
    // Join room
    'join-room-title':    'Rejoindre une Room',
    'label-room-code':    'Code',
    'btn-join-room':      'Rejoindre',
    'err-code-short':     'Code incomplet — 4 caractères requis.',
    // Lobby
    'lobby-title':    "Salon d'attente",
    'lbl-code':       'CODE',
    'badge-host':     'Hôte',
    'lobby-sprint2':  'Connexion en ligne disponible prochainement',
    'btn-start':      'Démarrer',
    // Setup solo
    'setup-tagline':  'Bonne chance au tapis !',
    'label-name':     'Ton prénom',
    'label-bank':     'Cagnotte de départ (€)',
    'ph-name':        'Joueur',
    'btn-play':       'Jouer',
    // Shared
    'btn-back':       '← Retour',
    'btn-quit':       '✕ Quitter',
    // HUD
    'hud-player':     'Joueur',
    'hud-bank-lbl':   'Cagnotte',
    'hud-bet-lbl':    'Mise actuelle',
    'hud-hands-lbl':  'Mains',
    'hud-won-lbl':    'Gagnées',
    'hud-lost-lbl':   'Perdues',
    // Game zones
    'zone-dealer':    'Croupier',
    'zone-player':    'Ta main',
    // Bet
    'bet-label':      'MISE :',
    'btn-clear':      'Effacer',
    'btn-deal':       'Distribuer ▶',
    'btn-hit':        'Tirer',
    'btn-stand':      'Rester',
    'btn-double':     'Doubler',
    // Messages
    'NO_FUNDS':       'Pas assez de fonds !',
    'NO_BET':         "Place une mise d'abord !",
    'msg-start':      'Place ta mise et distribue !',
    'msg-play':       'Tirer, rester ou doubler ?',
    'msg-clear':      'Mise effacée.',
    'msg-new-hand':   'Nouvelle main ?',
    'confirm-quit':   'Une main est en cours. Quitter quand même ?',
    // Chat
    'chat-title':   'Chat',
    'chat-s2':      'Sprint 2',
    'chat-empty':   "Aucun message pour l'instant.",
    'chat-ph':      'Message...',
    'gif-search-ph':'Chercher un GIF...',
    'media-url-ph': "Coller une URL d'image...",
    'btn-gif':      'GIF',
    'gif-no-result':'Aucun résultat.',
    'gif-loading':  '...',
    'gif-error':    'Erreur réseau.',
    // Game over
    'go-title':    'Session Terminée',
    'go-subtitle': 'Ta cagnotte est à zéro.',
    'go-hands':    'Mains',
    'go-won':      'Victoires',
    'go-lost':     'Défaites',
    'go-ratio':    'Taux victoire',
    'go-restart':  'Nouvelle partie',
    'go-home':     'Accueil',
    'go-redirect': (n) => `Retour à l'accueil dans ${n}s…`,
    // Rules
    'rules-title':    'Règles du Blackjack',
    'rules-obj-title':   '🎯 Objectif',
    'rules-obj-body':    'Se rapprocher de 21 sans dépasser, battre le croupier.',
    'rules-cards-title': '🃏 Valeurs des cartes',
    'rules-cards-1':     '2–10 → valeur nominale',
    'rules-cards-2':     'Valet, Dame, Roi → 10',
    'rules-cards-3':     'As → 11 ou 1',
    'rules-play-title':  '📋 Déroulement',
    'rules-play-1':      'Place ta mise avec les jetons',
    'rules-play-2':      'Reçois 2 cartes, croupier 2 (1 cachée)',
    'rules-play-3':      'Tirer — carte supplémentaire',
    'rules-play-4':      'Rester — garder ta main',
    'rules-play-5':      'Doubler — ×2 mise, 1 seule carte',
    'rules-play-6':      'Croupier joue, s\'arrête à 17+',
    'rules-pay-title':   '💰 Gains',
    'rules-pay-1':       'Blackjack (As + 10) → +150% mise',
    'rules-pay-2':       'Victoire → +100% mise',
    'rules-pay-3':       'Égalité → mise remboursée',
    'rules-pay-4':       'Défaite / Bust → mise perdue',
    // Results
    'res-blackjack':  (a) => `✦ BLACKJACK ! +${a} €`,
    'res-win':        (a) => `Gagné ! +${a} €`,
    'res-push':       ()  => 'Égalité — Remboursé',
    'res-bust':       (a) => `Bust ! −${a} €`,
    'res-lose':       (a) => `Perdu ! −${a} €`,
  },
  en: {
    'brand-sub':       'Casino Royale — Single Deck',
    'landing-tagline': 'Choose your table',
    'landing-solo-title': 'Solo',
    'landing-solo-desc':  'Player vs house',
    'landing-multi-title': 'Multiplayer',
    'landing-multi-desc':  'Up to 10 players',
    'tag-soon':        'Sprint 2',
    'multi-tagline':      'Play with your friends',
    'multi-create-title': 'Create a Room',
    'multi-create-desc':  'Generate a code and invite friends',
    'multi-join-title':   'Join',
    'multi-join-desc':    'Join with a code',
    'create-room-title':  'New Room',
    'label-room-name':    'Room name',
    'ph-room-name':       'Optional...',
    'label-max-players':  'Max players',
    'label-game-mode':    'Game mode',
    'mode-timed-title':   'Timed',
    'mode-timed-desc':    '30s bet · 25s play',
    'mode-free-title':    'Free play',
    'mode-free-desc':     'No time limit',
    'btn-create-room':    'Create Room',
    'join-room-title':    'Join a Room',
    'label-room-code':    'Code',
    'btn-join-room':      'Join',
    'err-code-short':     'Incomplete code — 4 characters required.',
    'lobby-title':    'Lobby',
    'lbl-code':       'CODE',
    'badge-host':     'Host',
    'lobby-sprint2':  'Online connection coming soon',
    'btn-start':      'Start',
    'setup-tagline':  'Good luck at the table!',
    'label-name':     'Your name',
    'label-bank':     'Starting bankroll (€)',
    'ph-name':        'Player',
    'btn-play':       'Play',
    'btn-back':       '← Back',
    'btn-quit':       '✕ Quit',
    'hud-player':     'Player',
    'hud-bank-lbl':   'Bankroll',
    'hud-bet-lbl':    'Current bet',
    'hud-hands-lbl':  'Hands',
    'hud-won-lbl':    'Won',
    'hud-lost-lbl':   'Lost',
    'zone-dealer':    'Dealer',
    'zone-player':    'Your hand',
    'bet-label':      'BET:',
    'btn-clear':      'Clear',
    'btn-deal':       'Deal ▶',
    'btn-hit':        'Hit',
    'btn-stand':      'Stand',
    'btn-double':     'Double',
    'NO_FUNDS':       'Not enough funds!',
    'NO_BET':         'Place a bet first!',
    'msg-start':      'Place your bet and deal!',
    'msg-play':       'Hit, stand, or double?',
    'msg-clear':      'Bet cleared.',
    'msg-new-hand':   'New hand?',
    'confirm-quit':   'A hand is in progress. Quit anyway?',
    // Chat
    'chat-title':   'Chat',
    'chat-s2':      'Sprint 2',
    'chat-empty':   'No messages yet.',
    'chat-ph':      'Message...',
    'gif-search-ph':'Search for a GIF...',
    'media-url-ph': 'Paste an image URL...',
    'btn-gif':      'GIF',
    'gif-no-result':'No results.',
    'gif-loading':  '...',
    'gif-error':    'Network error.',
    // Game over
    'go-title':    'Session Over',
    'go-subtitle': 'Your bankroll is empty.',
    'go-hands':    'Hands',
    'go-won':      'Wins',
    'go-lost':     'Losses',
    'go-ratio':    'Win rate',
    'go-restart':  'New game',
    'go-home':     'Home',
    'go-redirect': (n) => `Back to home in ${n}s…`,
    // Rules
    'rules-title':    'Blackjack Rules',
    'rules-obj-title':   '🎯 Objective',
    'rules-obj-body':    'Get closer to 21 than the dealer without going over.',
    'rules-cards-title': '🃏 Card Values',
    'rules-cards-1':     '2–10 → face value',
    'rules-cards-2':     'Jack, Queen, King → 10',
    'rules-cards-3':     'Ace → 11 or 1',
    'rules-play-title':  '📋 How to play',
    'rules-play-1':      'Place your bet with chips',
    'rules-play-2':      'Receive 2 cards, dealer gets 2 (1 face down)',
    'rules-play-3':      'Hit — take another card',
    'rules-play-4':      'Stand — keep your hand',
    'rules-play-5':      'Double — ×2 bet, 1 card only',
    'rules-play-6':      'Dealer plays, stops at 17+',
    'rules-pay-title':   '💰 Payouts',
    'rules-pay-1':       'Blackjack (Ace + 10) → +150% of bet',
    'rules-pay-2':       'Win → +100% of bet',
    'rules-pay-3':       'Push → bet refunded',
    'rules-pay-4':       'Lose / Bust → bet lost',
    'res-blackjack':  (a) => `✦ BLACKJACK! +${a} €`,
    'res-win':        (a) => `Won! +${a} €`,
    'res-push':       ()  => 'Push — Refunded',
    'res-bust':       (a) => `Bust! −${a} €`,
    'res-lose':       (a) => `Lost! −${a} €`,
  }
};

function t(key, ...args) {
  const val = LANG[currentLang]?.[key];
  if (val == null) return key;
  return typeof val === 'function' ? val(...args) : val;
}

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPh);
  });
  document.getElementById('btn-lang').textContent = '🌐 ' + currentLang.toUpperCase();
  document.documentElement.setAttribute('lang', currentLang);
}

export function toggleLang() {
  currentLang = currentLang === 'fr' ? 'en' : 'fr';
  localStorage.setItem('bj-lang', currentLang);
  applyLang();
}

// ─── NAVIGATION ──────────────────────────────────────────────────────
export function goToLanding() { showScreen('landing-screen'); }
export function goToSolo()    { showScreen('setup-screen'); }
export function goToMulti()   { showScreen('multi-screen'); }

export function goToCreateRoom() {
  showScreen('create-room-screen');
}

export function goToJoinRoom() {
  document.querySelectorAll('.code-char').forEach(i => { i.value = ''; });
  document.getElementById('join-msg').textContent = '';
  showScreen('join-room-screen');
  setTimeout(() => document.getElementById('code-0')?.focus(), 60);
}

// ─── ROOM LOGIC ──────────────────────────────────────────────────────
let roomMode = 'free';
let playerCountVal = 6;

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function selectMode(mode) {
  M.selectMode(mode);
}

export function adjustPlayerCount(delta) {
  M.adjustPlayerCount(delta);
}

export function handleCreateRoom() {
  M.initSocket();
  M.handleCreateRoom();
}

export function handleJoinRoom() {
  M.initSocket();
  M.handleJoinRoom();
}

export function handleLobbyStart() {
  M.handleLobbyStart();
}

// ─── CODE INPUT AUTO-ADVANCE ─────────────────────────────────────────
function setupCodeInputs() {
  const inputs = [...document.querySelectorAll('.code-char')];
  inputs.forEach((input, i) => {
    input.addEventListener('input', () => {
      input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1);
      if (input.value && i < inputs.length - 1) inputs[i + 1].focus();
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !input.value && i > 0) {
        inputs[i - 1].value = '';
        inputs[i - 1].focus();
      }
    });
  });
}

// ─── SOLO GAME ───────────────────────────────────────────────────────
export function startGame() {
  const name      = document.getElementById('player-name').value.trim() || t('ph-name');
  const startBank = parseInt(document.getElementById('start-bank').value) || 500;

  setConfig(name, startBank);
  buildDeck();
  switchScreens();
  setPlayerNameHUD(name);
  buildChips(CHIP_DENOMINATIONS, handleChip);
  updateHUD(G.bank, G.currentBet, G.handsPlayed, G.handsWon, G.handsLost);
  setMsg(t('msg-start'));
}

function handleChip(value) {
  if (M.currentRoom) {
    M.handleChipMulti(value);
  } else {
    const res = addBet(value);
    if (!res.ok) { if (res.msg) setMsg(t(res.msg)); return; }
    hideResult();
    setMsg('');
    updateHUD(G.bank, G.currentBet, G.handsPlayed, G.handsWon, G.handsLost);
  }
}

export function handleClearBet() {
  if (M.currentRoom) {
    M.handleClearBetMulti();
  } else {
    if (clearBet()) {
      updateHUD(G.bank, G.currentBet, G.handsPlayed, G.handsWon, G.handsLost);
      setMsg(t('msg-clear'));
    }
  }
}

export function handleDeal() {
  if (M.currentRoom) {
    M.handleDealMulti();
  } else {
    const res = startDeal();
    if (!res.ok) { setMsg(t(res.msg)); return; }
    hideResult();
    setActions(true);
    updateHUD(G.bank, G.currentBet, G.handsPlayed, G.handsWon, G.handsLost);
    renderCards('deal');
    // Wait for deal animation before resolving instant blackjack / push
    if (res.result) { setTimeout(() => endRound(res.result), 1900); return; }
    setMsg(t('msg-play'));
  }
}

export function handleHit() {
  if (M.currentRoom) {
    M.handleHitMulti();
  } else {
    if (G.phase !== 'play') return;
    const result = hit();
    renderCards('update');
    if (result === 'bust')  { endRound('bust'); return; }
    if (result === 'stand') { handleStand(); return; }
  }
}

export function handleStand() {
  if (M.currentRoom) {
    M.handleStandMulti();
  } else {
    if (G.phase !== 'play') return;
    endRound(dealerPlay());
  }
}

export function handleDouble() {
  if (M.currentRoom) {
    M.handleDoubleMulti();
  } else {
    if (G.phase !== 'play' || G.playerHand.length !== 2) return;
    const result = doubleDown();
    updateHUD(G.bank, G.currentBet, G.handsPlayed, G.handsWon, G.handsLost);
    renderCards('update');
    if (result === 'bust') { endRound('bust'); return; }
    endRound(dealerPlay());
  }
}

function endRound(result) {
  const lostBet = G.currentBet;
  const { gain, bankEmpty } = resolveRound(result);
  renderCards('reveal');
  setActions(false);
  updateHUD(G.bank, G.currentBet, G.handsPlayed, G.handsWon, G.handsLost);

  const resMap = {
    blackjack: { type: 'bj',   msg: t('res-blackjack', gain - lostBet) },
    win:       { type: 'win',  msg: t('res-win', gain - lostBet) },
    push:      { type: 'push', msg: t('res-push') },
    bust:      { type: 'lose', msg: t('res-bust', lostBet) },
    lose:      { type: 'lose', msg: t('res-lose', lostBet) },
  };
  const { type, msg } = resMap[result];
  showResult(type, msg);

  if (bankEmpty) {
    setTimeout(() => triggerGameOver(), 1200);
    return;
  }
  setMsg(t('msg-new-hand'));
  setTimeout(resetPhase, 300);
}

// ─── GAME OVER ───────────────────────────────────────────────────────
let _gameOverTimer = null;

function triggerGameOver() {
  const played = G.handsPlayed;
  const won    = G.handsWon;
  const lost   = G.handsLost;
  const ratio  = played > 0 ? Math.round(won / played * 100) + '%' : '—';

  document.getElementById('go-hands').textContent = played;
  document.getElementById('go-won').textContent   = won;
  document.getElementById('go-lost').textContent  = lost;
  document.getElementById('go-ratio').textContent = ratio;

  // Update translatable labels
  document.querySelectorAll('[data-i18n^="go-"]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });

  document.getElementById('gameover-overlay').classList.add('active');

  // Countdown auto-redirect (10s)
  let countdown = 10;
  const redirectEl = document.getElementById('go-redirect');
  redirectEl.textContent = t('go-redirect', countdown);
  _gameOverTimer = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(_gameOverTimer);
      handleGameOverHome();
    } else {
      redirectEl.textContent = t('go-redirect', countdown);
    }
  }, 1000);
}

function _closeGameOver() {
  clearInterval(_gameOverTimer);
  document.getElementById('gameover-overlay').classList.remove('active');
  quitGame();
  resetGameDOM();
}

export function handleGameOverRestart() {
  _closeGameOver();
  goToSolo();
}

export function handleGameOverHome() {
  _closeGameOver();
  goToLanding();
}

export function handleQuit() {
  if (G.phase === 'play') {
    if (!confirm(t('confirm-quit'))) return;
  }
  quitGame();
  resetGameDOM(G.bank, G.playerName);
  goToLanding();
}

// ─── DARK MODE ───────────────────────────────────────────────────────
export function toggleDarkMode() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = isDark ? '' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  document.getElementById('btn-darkmode').textContent = next === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('bj-theme', next);
}

// ─── CHAT ────────────────────────────────────────────────────────────
// Public Giphy beta key — replace with your own at giphy.com/developer
const GIPHY_KEY = 'dc6zaTOxFJmzC';

const chatMessages = [];
let pendingMediaUrl = null;
let gifPickerOpen   = false;
let mediaInputOpen  = false;
let unreadCount     = 0;

function _escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _chatAuthor() {
  return G.playerName
    || document.getElementById('create-player-name')?.value.trim()
    || document.getElementById('join-player-name')?.value.trim()
    || t('ph-name');
}

function _appendMsg(msg) {
  const container = document.getElementById('chat-messages');
  const empty = container.querySelector('.chat-empty');
  if (empty) empty.remove();

  const div = document.createElement('div');
  div.className = 'chat-msg';
  const time = new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let html = `<div class="chat-msg-header">
    <span class="chat-msg-author">${_escHtml(msg.author)}</span>
    <span class="chat-msg-time">${time}</span>
  </div>`;
  if (msg.mediaUrl) {
    html += `<img class="chat-msg-media" src="${_escHtml(msg.mediaUrl)}" loading="lazy" alt="" />`;
  }
  if (msg.text) {
    html += `<span class="chat-msg-text">${_escHtml(msg.text)}</span>`;
  }
  div.innerHTML = html;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;

  // Unread badge when panel is closed
  if (!document.getElementById('chat-panel').classList.contains('open')) {
    unreadCount++;
    const badge = document.getElementById('chat-badge');
    badge.textContent = unreadCount;
    badge.classList.add('visible');
  }
}

export function openChat() {
  document.getElementById('chat-panel').classList.add('open');
  document.getElementById('chat-toggle-btn').classList.remove('visible');
  unreadCount = 0;
  const badge = document.getElementById('chat-badge');
  badge.classList.remove('visible');
  setTimeout(() => document.getElementById('chat-input')?.focus(), 320);
}

export function closeChat() {
  document.getElementById('chat-panel').classList.remove('open');
  const panel = document.getElementById('chat-panel');
  // Show toggle only if we're in a chat-eligible screen
  const onChatScreen = ['multi-screen','create-room-screen','join-room-screen','lobby-screen']
    .some(id => document.getElementById(id)?.style.display !== 'none');
  if (onChatScreen) {
    document.getElementById('chat-toggle-btn').classList.add('visible');
  }
}

export function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text  = input.value.trim();
  if (!text && !pendingMediaUrl) return;

  const msg = {
    author:   _chatAuthor(),
    text:     text || null,
    mediaUrl: pendingMediaUrl,
    ts:       Date.now()
  };
  chatMessages.push(msg);
  _appendMsg(msg);
  input.value = '';
  clearPendingMedia();
  _closeGifPicker();
  _closeMediaInput();
}

export function toggleGifPicker() {
  gifPickerOpen = !gifPickerOpen;
  document.getElementById('gif-picker').classList.toggle('open', gifPickerOpen);
  document.getElementById('btn-gif-tool').classList.toggle('active', gifPickerOpen);
  if (gifPickerOpen && mediaInputOpen) _closeMediaInput();
}

function _closeGifPicker() {
  gifPickerOpen = false;
  document.getElementById('gif-picker').classList.remove('open');
  document.getElementById('btn-gif-tool').classList.remove('active');
}

export function toggleMediaInput() {
  mediaInputOpen = !mediaInputOpen;
  document.getElementById('media-url-row').classList.toggle('open', mediaInputOpen);
  document.getElementById('btn-img-tool').classList.toggle('active', mediaInputOpen);
  if (mediaInputOpen && gifPickerOpen) _closeGifPicker();
  if (mediaInputOpen) setTimeout(() => document.getElementById('media-url-input')?.focus(), 80);
}

function _closeMediaInput() {
  mediaInputOpen = false;
  document.getElementById('media-url-row').classList.remove('open');
  document.getElementById('btn-img-tool').classList.remove('active');
}

export function confirmMediaUrl() {
  const url = document.getElementById('media-url-input').value.trim();
  if (url) { _setPendingMedia(url); document.getElementById('media-url-input').value = ''; }
  _closeMediaInput();
}

export function selectGif(url) {
  _setPendingMedia(url);
  _closeGifPicker();
}

function _setPendingMedia(url) {
  pendingMediaUrl = url;
  const preview = document.getElementById('chat-media-preview');
  document.getElementById('chat-preview-img').src = url;
  preview.style.display = 'flex';
}

export function clearPendingMedia() {
  pendingMediaUrl = null;
  document.getElementById('chat-media-preview').style.display = 'none';
  document.getElementById('chat-preview-img').src = '';
}

export async function searchGifs() {
  const query = document.getElementById('gif-search-input').value.trim();
  if (!query) return;
  const results = document.getElementById('gif-results');
  results.innerHTML = `<span class="gif-status">${t('gif-loading')}</span>`;
  try {
    const res  = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=12&rating=g`
    );
    const data = await res.json();
    results.innerHTML = '';
    if (!data.data?.length) {
      results.innerHTML = `<span class="gif-status">${t('gif-no-result')}</span>`;
      return;
    }
    data.data.forEach(gif => {
      const img = document.createElement('img');
      img.className   = 'gif-thumb';
      img.src         = gif.images.fixed_height_small.url;
      img.loading     = 'lazy';
      img.alt         = gif.title || '';
      img.onclick     = () => selectGif(gif.images.original.url);
      results.appendChild(img);
    });
  } catch {
    results.innerHTML = `<span class="gif-status" style="color:var(--result-lose)">${t('gif-error')}</span>`;
  }
}

function setupChat() {
  // Enter → send chat message
  document.getElementById('chat-input')
    ?.addEventListener('keydown', e => { if (e.key === 'Enter') sendChatMessage(); });
  // Enter → search GIFs
  document.getElementById('gif-search-input')
    ?.addEventListener('keydown', e => { if (e.key === 'Enter') searchGifs(); });
  // Enter → confirm media URL
  document.getElementById('media-url-input')
    ?.addEventListener('keydown', e => { if (e.key === 'Enter') confirmMediaUrl(); });
}

// ─── INIT ────────────────────────────────────────────────────────────
if (localStorage.getItem('bj-theme') === 'dark') {
  document.getElementById('btn-darkmode').textContent = '☀️';
}
applyLang();
showScreen('landing-screen');
setupCodeInputs();
setupChat();

// Initialize multijoueur module
M.setTranslator(t);
M.setMsgFunction(setMsg);

// ─── KEYBOARD ────────────────────────────────────────────────────────
document.getElementById('player-name')
  .addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });

// ─── EXPOSE TO HTML onclick ──────────────────────────────────────────
window.startGame         = startGame;
window.handleDeal        = handleDeal;
window.handleHit         = handleHit;
window.handleStand       = handleStand;
window.handleDouble      = handleDouble;
window.handleClearBet    = handleClearBet;
window.handleQuit        = handleQuit;
window.toggleDarkMode    = toggleDarkMode;
window.toggleLang        = toggleLang;
window.goToLanding       = goToLanding;
window.goToSolo          = goToSolo;
window.goToMulti         = goToMulti;
window.goToCreateRoom    = goToCreateRoom;
window.goToJoinRoom      = goToJoinRoom;
window.selectMode        = selectMode;
window.adjustPlayerCount = adjustPlayerCount;
window.handleCreateRoom  = handleCreateRoom;
window.handleJoinRoom    = handleJoinRoom;
window.copyCode             = copyCode;
window.handleLobbyStart     = handleLobbyStart;
window.handleGameOverRestart = handleGameOverRestart;
window.handleGameOverHome    = handleGameOverHome;
window.openChat          = openChat;
window.closeChat         = closeChat;
window.sendChatMessage   = sendChatMessage;
window.toggleGifPicker   = toggleGifPicker;
window.toggleMediaInput  = toggleMediaInput;
window.confirmMediaUrl   = confirmMediaUrl;
window.selectGif         = selectGif;
window.clearPendingMedia = clearPendingMedia;
window.searchGifs        = searchGifs;
