# Flashbang

A browser-based multiplayer FPS built with Three.js and Socket.IO. Flashbang grenades are the core mechanic: throw one to blind nearby enemies who are looking at it.

## Run locally

```
npm install
npm start
```

Then open `http://localhost:3000` in multiple browser tabs/windows to play against yourself, or share your IP with friends on the same network.

## Controls

- **WASD** — move
- **Mouse** — look
- **Left click** — shoot
- **G** — throw flashbang
- **Space** — jump

## Architecture

- `server/index.js` — authoritative Node.js/Socket.IO server: tracks player state, simulates grenade physics, resolves flashbang blind effects and hit damage, broadcasts world snapshots at 30Hz.
- `public/js/main.js` — Three.js client: rendering, pointer-lock FPS controls, local collision, HUD, and network sync.
