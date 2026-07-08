import { cardVal, handScore, phase, dealerHand, playerHand } from './game.js';

const RED_SUITS = ['♥', '♦'];

const ALL_SCREENS = [
  'landing-screen', 'setup-screen', 'multi-screen',
  'create-room-screen', 'join-room-screen', 'lobby-screen', 'game-screen'
];

const CHAT_SCREENS = ['multi-screen', 'create-room-screen', 'join-room-screen', 'lobby-screen'];

export function showScreen(id) {
  ALL_SCREENS.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? 'block' : 'none';
  });
  document.getElementById('btn-quit').style.display = id === 'game-screen' ? 'inline-flex' : 'none';

  const panel     = document.getElementById('chat-panel');
  const toggleBtn = document.getElementById('chat-toggle-btn');
  const isChat    = CHAT_SCREENS.includes(id);

  if (!isChat) {
    panel?.classList.remove('open');
    toggleBtn?.classList.remove('visible');
  } else if (!panel?.classList.contains('open')) {
    toggleBtn?.classList.add('visible');
  }
}

export function formatAmount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 10_000)    return Math.round(n / 1000) + 'K';
  if (n >= 1_000)     return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function chipLabel(v) {
  if (v >= 100_000) return '100K';
  if (v >= 10_000)  return '10K';
  if (v >= 1_000)   return '1K';
  return String(v);
}

// ─── CARD ELEMENT ────────────────────────────────────────────────────
// delay: ms before animation starts (stagger effect)
// flip:  true = card-reveal flip animation instead of deal animation
export function cardEl(card, hidden = false, delay = 0, flip = false) {
  const d = document.createElement('div');
  const isRed = RED_SUITS.includes(card.s);
  let cls = 'card ' + (hidden ? 'hidden' : (isRed ? 'red' : 'black'));
  if (flip) cls += ' flip';
  d.className = cls;
  if (delay > 0) d.style.animationDelay = delay + 'ms';
  if (hidden) {
    d.innerHTML = '<div class="card-top"> </div><div class="card-suit"> </div><div class="card-bot"> </div>';
  } else {
    d.innerHTML = `<div class="card-top">${card.v}</div><div class="card-suit">${card.s}</div><div class="card-bot">${card.v}</div>`;
  }
  return d;
}

// ─── RENDER CARDS ────────────────────────────────────────────────────
// mode 'deal'   → clear + full stagger (new round)
// mode 'reveal' → flip hidden dealer card + append new dealer cards
// mode 'update' → append only new cards (hit, double player card)
export function renderCards(mode = 'update') {
  const dc = document.getElementById('dealer-cards');
  const pc = document.getElementById('player-cards');

  if (mode === 'deal') {
    dc.innerHTML = '';
    pc.innerHTML = '';
    // Dealer cards first, then player cards with extra offset
    dealerHand.forEach((c, i) => dc.appendChild(cardEl(c, i === 1, i * 300)));
    playerHand.forEach((c, i) => pc.appendChild(cardEl(c, false, i * 300 + 800)));

  } else if (mode === 'reveal') {
    // Flip the dealer's hidden card
    const dealerEls = dc.querySelectorAll('.card');
    if (dealerEls[1]?.classList.contains('hidden')) {
      dealerEls[1].replaceWith(cardEl(dealerHand[1], false, 0, true));
    }
    // Append new dealer cards drawn during dealerPlay()
    const afterFlip = dc.querySelectorAll('.card').length;
    for (let i = afterFlip; i < dealerHand.length; i++) {
      dc.appendChild(cardEl(dealerHand[i], false, (i - afterFlip + 1) * 500));
    }
    // Append any new player cards (e.g. after double)
    const playerEls = pc.querySelectorAll('.card');
    for (let i = playerEls.length; i < playerHand.length; i++) {
      pc.appendChild(cardEl(playerHand[i], false, 150));
    }

  } else {
    // 'update' — only append new cards
    const dealerEls = dc.querySelectorAll('.card');
    const playerEls = pc.querySelectorAll('.card');
    for (let i = dealerEls.length; i < dealerHand.length; i++) {
      dc.appendChild(cardEl(dealerHand[i], false, 150));
    }
    for (let i = playerEls.length; i < playerHand.length; i++) {
      pc.appendChild(cardEl(playerHand[i], false, 150));
    }
  }

  _updateScores();
}

function _popBadge(el) {
  el.classList.remove('pop');
  void el.offsetWidth; // force reflow to restart animation
  el.classList.add('pop');
}

function _updateScores() {
  const playerScoreEl = document.getElementById('player-score');
  const dealerScoreEl = document.getElementById('dealer-score');

  if (playerHand.length) {
    const ps = handScore(playerHand);
    const changed = playerScoreEl.textContent !== String(ps);
    playerScoreEl.textContent = ps;
    if (changed) _popBadge(playerScoreEl);
  } else {
    playerScoreEl.textContent = '';
  }

  if (phase === 'play') {
    dealerScoreEl.textContent = dealerHand.length ? cardVal(dealerHand[0]) : '';
  } else {
    if (dealerHand.length) {
      const ds = handScore(dealerHand);
      const changed = dealerScoreEl.textContent !== String(ds);
      dealerScoreEl.textContent = ds;
      if (changed) _popBadge(dealerScoreEl);
    } else {
      dealerScoreEl.textContent = '';
    }
  }
}

// ─── REST OF UI ──────────────────────────────────────────────────────
export function updateHUD(bank, bet, played, won, lost) {
  document.getElementById('hud-bank').textContent   = formatAmount(bank) + ' €';
  document.getElementById('hud-bet').textContent    = formatAmount(bet) + ' €';
  document.getElementById('hud-hands').textContent  = played;
  document.getElementById('hud-won').textContent    = won;
  document.getElementById('hud-lost').textContent   = lost;
  document.getElementById('bet-display').textContent = formatAmount(bet) + ' €';
}

export function showResult(type, text) {
  const b = document.getElementById('result-banner');
  b.className = 'result-banner'; // reset first to replay animation
  b.textContent = text;
  void b.offsetWidth;            // force reflow
  b.className = 'result-banner ' + type;
}

export function hideResult() {
  document.getElementById('result-banner').className = 'result-banner';
}

export function setMsg(text) {
  document.getElementById('msg').textContent = text;
}

export function setActions(playMode) {
  document.getElementById('btn-deal').disabled   = playMode;
  document.getElementById('btn-hit').disabled    = !playMode;
  document.getElementById('btn-stand').disabled  = !playMode;
  document.getElementById('btn-double').disabled = !playMode;
  document.getElementById('btn-clear').disabled  = playMode;

  const chips = document.getElementById('chips-row');
  chips.style.opacity       = playMode ? '0.3' : '1';
  chips.style.pointerEvents = playMode ? 'none' : 'auto';
}

export function buildChips(denominations, onChipClick) {
  const row = document.getElementById('chips-row');
  row.innerHTML = '';
  denominations.forEach(v => {
    const c = document.createElement('div');
    c.className = `chip chip-${v}`;
    c.textContent = chipLabel(v);
    c.onclick = () => onChipClick(v);
    row.appendChild(c);
  });
}

export function switchScreens() {
  showScreen('game-screen');
}

export function setPlayerNameHUD(name) {
  document.getElementById('hud-name').textContent = name;
}

export function resetGameDOM(currentBank, currentName) {
  if (currentBank !== undefined) document.getElementById('start-bank').value  = currentBank;
  if (currentName !== undefined) document.getElementById('player-name').value = currentName;
  document.getElementById('dealer-cards').innerHTML = '';
  document.getElementById('player-cards').innerHTML = '';
  document.getElementById('dealer-score').textContent = '';
  document.getElementById('player-score').textContent = '';
  document.getElementById('result-banner').className = 'result-banner';
  document.getElementById('msg').textContent = '';
}
