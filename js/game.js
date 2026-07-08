const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export let deck = [];
export let playerHand = [];
export let dealerHand = [];
export let bank = 500;
export let currentBet = 0;
export let handsPlayed = 0;
export let handsWon = 0;
export let handsLost = 0;
export let playerName = 'Joueur';
export let phase = 'bet'; // 'bet' | 'play' | 'over'

export function setConfig(name, startBank) {
  playerName = name;
  bank = startBank;
  handsPlayed = 0;
  handsWon = 0;
  handsLost = 0;
}

export function buildDeck() {
  deck = [];
  for (const s of SUITS)
    for (const v of VALUES)
      deck.push({ s, v });

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

export function cardVal(card) {
  if (['J', 'Q', 'K'].includes(card.v)) return 10;
  if (card.v === 'A') return 11;
  return parseInt(card.v);
}

export function handScore(hand) {
  let s = 0, aces = 0;
  for (const c of hand) { s += cardVal(c); if (c.v === 'A') aces++; }
  while (s > 21 && aces > 0) { s -= 10; aces--; }
  return s;
}

export function addBet(value) {
  if (phase !== 'bet') return { ok: false, msg: '' };
  if (currentBet + value > bank) return { ok: false, msg: 'NO_FUNDS' };
  currentBet += value;
  return { ok: true };
}

export function clearBet() {
  if (phase !== 'bet') return false;
  currentBet = 0;
  return true;
}

export function startDeal() {
  if (currentBet === 0) return { ok: false, msg: 'NO_BET' };
  if (deck.length < 15) buildDeck();

  playerHand = [deck.pop(), deck.pop()];
  dealerHand = [deck.pop(), deck.pop()];
  phase = 'play';
  bank -= currentBet;
  handsPlayed++;

  const ps = handScore(playerHand);
  const ds = handScore(dealerHand);
  if (ps === 21 && ds === 21) return { ok: true, result: 'push' };
  if (ps === 21)              return { ok: true, result: 'blackjack' };
  return { ok: true, result: null };
}

export function hit() {
  playerHand.push(deck.pop());
  const s = handScore(playerHand);
  if (s > 21) return 'bust';
  if (s === 21) return 'stand';
  return null;
}

export function doubleDown() {
  const extra = Math.min(currentBet, bank);
  bank -= extra;
  currentBet += extra;
  playerHand.push(deck.pop());
  const s = handScore(playerHand);
  return s > 21 ? 'bust' : 'stand';
}

export function dealerPlay() {
  while (handScore(dealerHand) < 17) dealerHand.push(deck.pop());
  const ps = handScore(playerHand);
  const ds = handScore(dealerHand);
  if (ds > 21 || ps > ds) return 'win';
  if (ps === ds)          return 'push';
  return 'lose';
}

export function resolveRound(result) {
  phase = 'over';
  let gain = 0;

  if (result === 'blackjack') { gain = Math.floor(currentBet * 1.5) + currentBet; bank += gain; handsWon++; }
  else if (result === 'win')  { gain = currentBet * 2; bank += gain; handsWon++; }
  else if (result === 'push') { bank += currentBet; }
  else                        { handsLost++; }

  currentBet = 0;
  return { gain, bankEmpty: bank <= 0 };
}

export function resetPhase() {
  phase = 'bet';
}

export function reloadBank(amount) {
  if (amount <= 0) return false;
  bank = amount;
  return true;
}

export function quitGame() {
  playerHand = [];
  dealerHand = [];
  currentBet = 0;
  phase = 'bet';
}
