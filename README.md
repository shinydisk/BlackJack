# ♠ Blackjack ♥

> Casino Royale — Single Deck | by **Sh1nyd1sk**

![Vanilla JS](https://img.shields.io/badge/vanilla-JS-f7df1e?style=flat-square&logo=javascript&logoColor=black)
![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen?style=flat-square)
![Docker](https://img.shields.io/badge/docker-ready-2496ed?style=flat-square&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

A browser-based Blackjack simulator built in vanilla JS — no framework, no bundler. Features dark/light mode, bilingual interface (FR/EN), and Docker support. Multiplayer arrives in Sprint 2.

---

## Features

| Feature | Status |
|---|---|
| Solo mode — unlimited bankroll, no max bet | ✅ |
| Dark / Light mode (persisted) | ✅ |
| FR / EN bilingual interface (persisted) | ✅ |
| Chips: 5 · 10 · 25 · 50 · 100 · 1K · 10K · 100K | ✅ |
| HUD: bankroll, bet, hands played, wins, losses | ✅ |
| Smart amount display (500, 1.5K, 100K, 1.5M) | ✅ |
| Landing page + Solo / Multiplayer navigation | ✅ |
| Multiplayer rooms — create & join (Firebase) | 🔜 Sprint 2 |
| Timed mode (30s bet · 25s play) / Free mode | 🔜 Sprint 2 |
| Up to 10 players per room | 🔜 Sprint 2 |
| Real-time hand visibility between players | 🔜 Sprint 2 |

---

## Getting started

### With Docker (recommended)

```bash
docker compose up -d
```

Open **http://localhost:3000**

Rebuild after a change:

```bash
docker compose up -d --build
```

---

## Server setup

### With Docker Compose (recommended)

1. Start both services: frontend and backend.
2. The frontend is served on **http://localhost:3000**.
3. The Socket.IO backend is exposed on **http://localhost:4000**.
4. Verify the backend with:

```bash
curl http://localhost:4000/health
```

### Without Docker

1. Install the server dependencies:

```bash
cd server
npm install
```

2. Start the backend server:

```bash
npm start
```

3. In another terminal, run the frontend locally from the repo root:

```bash
cd ..
python3 -m http.server 3000
```

4. Open **http://localhost:3000** and make sure the backend is reachable at **http://localhost:4000/health**.

> If port `4000` is already in use, start the server with another port: `PORT=4001 npm start`.

---

## Rules

| Result | Payout |
|---|---|
| Blackjack (Ace + 10 on first deal) | +150% of bet |
| Win | +100% of bet |
| Push (tie) | Bet refunded |
| Lose / Bust (> 21) | Bet lost |

- **Cards** — 2–10 → face value · J/Q/K → 10 · Ace → 11 or 1
- **Dealer** — draws to 16, stands on 17+
- **Double** — bet ×2, receive exactly one more card
- **Bust** — going over 21 is an automatic loss

---

## Project structure

```
BlackJack/
├── index.html           # All screens (landing, setup, multi, lobby, game)
├── css/
│   └── styles.css       # Design tokens (light/dark) + all component styles
├── js/
│   ├── game.js          # Pure game logic — deck, hands, scores, state
│   ├── ui.js            # DOM rendering + screen management
│   └── main.js          # Navigation, i18n, event handlers
├── Dockerfile
├── Dockerfile.server
├── docker-compose.yml
└── server/
    ├── index.js         # Socket.IO multiplayer server
    ├── rooms.js         # Room and game-room state management
    └── package.json     # Backend dependencies and start scripts
```

### Module responsibilities

| File | Role |
|---|---|
| `game.js` | Pure business logic, zero DOM. Independently testable. |
| `ui.js` | DOM rendering, screen switching, amount formatting. |
| `main.js` | Entry point — wires game + ui, handles events, exposes `window.*` handlers, manages i18n. |

---

## Stack

- **Vanilla JS** — ES modules, zero dependencies, no bundler
- **CSS custom properties** — full light/dark theming with smooth transitions
- **nginx:alpine** — static file serving in Docker (~7 MB image)

---

## Roadmap

### Sprint 1 ✅ — Solo + UI foundation
- Full Blackjack game logic (hit, stand, double, bust, push, blackjack)
- Light / dark mode toggle
- FR / EN bilingual i18n
- Large chip denominations (1K, 10K, 100K)
- Win / loss / hands tracking in HUD
- Landing page with Solo / Multiplayer navigation shell
- Room creation & join UI (frontend preview)
- Docker containerization

### Sprint 2 🔜 — Multiplayer
- Firebase Realtime Database integration
- Room creation with 4-char code + lobby
- Up to 10 players per room
- Simultaneous play (all players act at the same time)
- Timed mode (30s bet, 25s play) / Free mode toggle per room
- Real-time hand visibility for all players
- Auto-timeout + reconnection handling

---

## License

MIT
