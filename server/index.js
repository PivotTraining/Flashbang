const path = require('path');
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3000;

app.use('/vendor/three', express.static(path.join(__dirname, '../node_modules/three/build')));
app.use(express.static(path.join(__dirname, '../public')));

// --- Game constants ---
const TICK_RATE = 30;
const TICK_MS = 1000 / TICK_RATE;
const GRAVITY = -9.8;
const GRENADE_FUSE_MS = 1600;
const BLIND_RADIUS = 14;
const MAX_BLIND_DURATION_MS = 4000;
const MAX_HEALTH = 100;
const RESPAWN_DELAY_MS = 3000;
const ARENA_HALF_SIZE = 24;

const SPAWN_POINTS = [
  { x: 18, y: 1.7, z: 18 },
  { x: -18, y: 1.7, z: 18 },
  { x: 18, y: 1.7, z: -18 },
  { x: -18, y: 1.7, z: -18 },
  { x: 0, y: 1.7, z: 20 },
  { x: 0, y: 1.7, z: -20 },
];

function randomSpawn() {
  return { ...SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)] };
}

/** @type {Map<string, any>} */
const players = new Map();
/** @type {Map<string, any>} */
const grenades = new Map();
let grenadeSeq = 0;

function forwardVector(yaw, pitch) {
  return {
    x: -Math.sin(yaw) * Math.cos(pitch),
    y: Math.sin(pitch),
    z: -Math.cos(yaw) * Math.cos(pitch),
  };
}

io.on('connection', (socket) => {
  const spawn = randomSpawn();
  const player = {
    id: socket.id,
    name: `Player-${socket.id.slice(0, 4)}`,
    x: spawn.x,
    y: spawn.y,
    z: spawn.z,
    yaw: 0,
    pitch: 0,
    health: MAX_HEALTH,
    alive: true,
    kills: 0,
    deaths: 0,
    blindUntil: 0,
    blindIntensity: 0,
  };
  players.set(socket.id, player);

  socket.emit('init', {
    id: socket.id,
    arenaHalfSize: ARENA_HALF_SIZE,
    players: Array.from(players.values()),
  });
  socket.broadcast.emit('player_joined', player);

  socket.on('move', (data) => {
    const p = players.get(socket.id);
    if (!p || !p.alive) return;
    if (typeof data.x !== 'number' || typeof data.y !== 'number' || typeof data.z !== 'number') return;
    p.x = data.x;
    p.y = data.y;
    p.z = data.z;
    p.yaw = data.yaw || 0;
    p.pitch = data.pitch || 0;
  });

  socket.on('shoot', (data) => {
    const shooter = players.get(socket.id);
    if (!shooter || !shooter.alive) return;
    if (shooter.blindIntensity > 0.85 && Date.now() < shooter.blindUntil) return;
    const target = players.get(data.targetId);
    if (!target || !target.alive || target.id === shooter.id) return;
    const damage = Math.max(1, Math.min(100, Number(data.damage) || 0));
    target.health -= damage;
    io.emit('hit', { shooterId: shooter.id, targetId: target.id, damage, headshot: !!data.headshot });
    if (target.health <= 0) {
      target.alive = false;
      target.deaths += 1;
      shooter.kills += 1;
      io.emit('kill', { killerId: shooter.id, victimId: target.id });
      setTimeout(() => {
        const p = players.get(target.id);
        if (!p) return;
        const s = randomSpawn();
        p.x = s.x; p.y = s.y; p.z = s.z;
        p.health = MAX_HEALTH;
        p.alive = true;
        p.blindUntil = 0;
        p.blindIntensity = 0;
        io.emit('respawn', { id: p.id, x: p.x, y: p.y, z: p.z });
      }, RESPAWN_DELAY_MS);
    }
  });

  socket.on('throw_grenade', (data) => {
    const p = players.get(socket.id);
    if (!p || !p.alive) return;
    const id = `g${grenadeSeq++}`;
    grenades.set(id, {
      id,
      ownerId: p.id,
      x: data.x, y: data.y, z: data.z,
      vx: data.vx, vy: data.vy, vz: data.vz,
      spawnTime: Date.now(),
    });
  });

  socket.on('set_name', (name) => {
    const p = players.get(socket.id);
    if (!p) return;
    p.name = String(name).slice(0, 16) || p.name;
  });

  socket.on('disconnect', () => {
    players.delete(socket.id);
    io.emit('player_left', { id: socket.id });
  });
});

function tick() {
  const dt = TICK_MS / 1000;
  const now = Date.now();

  for (const [id, g] of grenades) {
    const age = now - g.spawnTime;
    if (age >= GRENADE_FUSE_MS) {
      detonate(g);
      grenades.delete(id);
      continue;
    }
    g.vy += GRAVITY * dt;
    g.x += g.vx * dt;
    g.y += g.vy * dt;
    g.z += g.vz * dt;
    if (g.y <= 0.2) {
      g.y = 0.2;
      g.vy = Math.abs(g.vy) * 0.4;
      g.vx *= 0.7;
      g.vz *= 0.7;
    }
    const half = ARENA_HALF_SIZE - 0.5;
    if (g.x > half || g.x < -half) { g.vx *= -0.5; g.x = Math.max(-half, Math.min(half, g.x)); }
    if (g.z > half || g.z < -half) { g.vz *= -0.5; g.z = Math.max(-half, Math.min(half, g.z)); }
  }

  const snapshot = {
    players: Array.from(players.values()),
    grenades: Array.from(grenades.values()).map(({ id, x, y, z, ownerId }) => ({ id, x, y, z, ownerId })),
    serverTime: now,
  };
  io.emit('state', snapshot);
}

function detonate(g) {
  io.emit('explosion', { x: g.x, y: g.y, z: g.z });
  for (const p of players.values()) {
    if (!p.alive) continue;
    const dx = g.x - p.x, dy = g.y - p.y, dz = g.z - p.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist >= BLIND_RADIUS) continue;
    const toGrenade = { x: dx / (dist || 1), y: dy / (dist || 1), z: dz / (dist || 1) };
    const fwd = forwardVector(p.yaw, p.pitch);
    const dot = fwd.x * toGrenade.x + fwd.y * toGrenade.y + fwd.z * toGrenade.z;
    const facingFactor = 0.35 + 0.65 * Math.max(0, dot);
    const proximity = 1 - dist / BLIND_RADIUS;
    const intensity = Math.min(1, proximity * facingFactor * 1.15);
    if (intensity <= 0.05) continue;
    const duration = MAX_BLIND_DURATION_MS * intensity;
    p.blindUntil = Date.now() + duration;
    p.blindIntensity = intensity;
  }
}

setInterval(tick, TICK_MS);

httpServer.listen(PORT, () => {
  console.log(`Flashbang server listening on http://localhost:${PORT}`);
});
