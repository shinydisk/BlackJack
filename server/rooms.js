// ─── GAME ROOM ────────────────────────────────────────────────────────
export class GameRoom {
  constructor(code, hostName, maxPlayers = 6, mode = 'free', roomName = '') {
    this.code = code;
    this.hostId = null;
    this.maxPlayers = maxPlayers;
    this.mode = mode; // 'timed' | 'free'
    this.roomName = roomName || `Table ${code}`;
    this.players = new Map(); // playerId -> {id, name, socket, hand, bet, bank}
    this.gameState = 'waiting'; // 'waiting' | 'betting' | 'playing' | 'over'
    this.deck = [];
    this.dealerHand = [];
    this.currentRound = 0;
    this.roundResults = new Map(); // playerId -> result
  }

  addPlayer(playerId, playerName, socket) {
    if (this.players.size === 0) {
      this.hostId = playerId;
    }
    
    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      socket: socket,
      hand: [],
      bet: 0,
      bank: 10000,
      busted: false,
      ready: false,
      result: null
    });
  }

  removePlayer(playerId) {
    const removed = this.players.delete(playerId);
    if (removed && this.hostId === playerId && this.players.size > 0) {
      this.hostId = Array.from(this.players.keys())[0];
    }
    return removed;
  }

  getPlayerCount() {
    return this.players.size;
  }

  isFull() {
    return this.players.size >= this.maxPlayers;
  }

  isHost(playerId) {
    return this.hostId === playerId;
  }

  getPlayersData() {
    return Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      isHost: this.hostId === p.id,
      bank: p.bank,
      status: this.gameState === 'waiting' ? 'ready' : (p.busted ? 'busted' : 'playing')
    }));
  }

  startGame() {
    this.gameState = 'betting';
    this.currentRound++;
    this.dealerHand = [];
    this.roundResults.clear();
    
    // Reset player hands
    for (const player of this.players.values()) {
      player.hand = [];
      player.bet = 0;
      player.busted = false;
      player.result = null;
      player.ready = false;
    }
    
    this.buildDeck();
  }

  executeAction(playerId, action, value) {
    const player = this.players.get(playerId);
    if (!player) return { ok: false, msg: 'Player not found' };

    if (action === 'bet') {
      if (this.gameState !== 'betting') return { ok: false, msg: 'Not in betting phase' };
      if (player.bet + value > player.bank) return { ok: false, msg: 'Insufficient funds' };
      player.bet += value;
      return { ok: true };
    }

    if (action === 'clear-bet') {
      if (this.gameState !== 'betting') return { ok: false, msg: 'Not in betting phase' };
      player.bet = 0;
      return { ok: true };
    }

    if (action === 'ready') {
      player.ready = true;
      // Check if all players ready
      const allReady = Array.from(this.players.values()).every(p => p.ready || p.bet === 0);
      if (allReady && Array.from(this.players.values()).some(p => p.bet > 0)) {
        this.dealCards();
      }
      return { ok: true };
    }

    if (action === 'hit') {
      if (this.gameState !== 'playing') return { ok: false, msg: 'Not in playing phase' };
      if (player.hand.length === 0) return { ok: false, msg: 'No hand to hit' };
      player.hand.push(this.deck.pop());
      const score = this.handScore(player.hand);
      if (score > 21) {
        player.busted = true;
        player.result = 'bust';
      }
      return { ok: true };
    }

    if (action === 'stand') {
      if (this.gameState !== 'playing') return { ok: false, msg: 'Not in playing phase' };
      player.ready = true;
      // Check if all players stood
      const allStood = Array.from(this.players.values()).every(p => p.ready || p.busted);
      if (allStood) {
        this.dealerPlay();
        this.resolveRound();
      }
      return { ok: true };
    }

    if (action === 'double') {
      if (this.gameState !== 'playing') return { ok: false, msg: 'Not in playing phase' };
      if (player.hand.length !== 2) return { ok: false, msg: 'Can only double on initial hand' };
      const extra = Math.min(player.bet, player.bank);
      if (extra === 0) return { ok: false, msg: 'Cannot double' };
      player.bank -= extra;
      player.bet += extra;
      player.hand.push(this.deck.pop());
      const score = this.handScore(player.hand);
      if (score > 21) {
        player.busted = true;
        player.result = 'bust';
      } else {
        player.ready = true;
        // Check if all players stood
        const allStood = Array.from(this.players.values()).every(p => p.ready || p.busted);
        if (allStood) {
          this.dealerPlay();
          this.resolveRound();
        }
      }
      return { ok: true };
    }

    return { ok: false, msg: 'Unknown action' };
  }

  dealCards() {
    this.gameState = 'playing';
    
    for (const player of this.players.values()) {
      if (player.bet > 0) {
        player.hand = [this.deck.pop(), this.deck.pop()];
        player.bank -= player.bet;
      }
    }
    
    this.dealerHand = [this.deck.pop(), this.deck.pop()];
  }

  dealerPlay() {
    while (this.handScore(this.dealerHand) < 17) {
      this.dealerHand.push(this.deck.pop());
    }
  }

  resolveRound() {
    this.gameState = 'over';
    const dealerScore = this.handScore(this.dealerHand);
    
    for (const player of this.players.values()) {
      if (player.bet === 0) continue;
      
      const playerScore = this.handScore(player.hand);
      
      if (player.busted) {
        player.result = 'bust';
      } else if (dealerScore > 21) {
        player.result = 'win';
        player.bank += player.bet * 2;
      } else if (playerScore > dealerScore) {
        player.result = 'win';
        player.bank += player.bet * 2;
      } else if (playerScore === dealerScore) {
        player.result = 'push';
        player.bank += player.bet;
      } else {
        player.result = 'loss';
      }
      
      this.roundResults.set(player.id, player.result);
    }
  }

  getGameState() {
    return {
      code: this.code,
      roomName: this.roomName,
      gameState: this.gameState,
      players: this.getPlayersData(),
      dealerHand: this.gameState === 'over' ? this.dealerHand : [this.dealerHand[0]],
      dealerScore: this.gameState === 'over' ? this.handScore(this.dealerHand) : null,
      playerStates: Array.from(this.players.entries()).map(([id, p]) => ({
        id,
        hand: p.hand,
        score: this.handScore(p.hand),
        bet: p.bet,
        bank: p.bank,
        busted: p.busted,
        result: p.result
      }))
    };
  }

  buildDeck() {
    const SUITS = ['♠', '♥', '♦', '♣'];
    const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    this.deck = [];
    for (const s of SUITS) {
      for (const v of VALUES) {
        this.deck.push({ s, v });
      }
    }
    
    // Shuffle
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
    
    if (this.deck.length < 15) this.buildDeck();
  }

  cardVal(card) {
    if (['J', 'Q', 'K'].includes(card.v)) return 10;
    if (card.v === 'A') return 11;
    return parseInt(card.v);
  }

  handScore(hand) {
    let s = 0, aces = 0;
    for (const c of hand) {
      s += this.cardVal(c);
      if (c.v === 'A') aces++;
    }
    while (s > 21 && aces > 0) {
      s -= 10;
      aces--;
    }
    return s;
  }
}
