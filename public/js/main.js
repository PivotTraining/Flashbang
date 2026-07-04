import * as THREE from 'three';

// ---------- constants (mirror server) ----------
const MAX_HEALTH = 100;
const RESPAWN_DELAY_MS = 3000;
const MOVE_SPEED = 7.5;
const JUMP_SPEED = 5.2;
const GRAVITY = -16;
const PLAYER_RADIUS = 0.5;
const PLAYER_HEIGHT = 1.7;
const FIRE_COOLDOWN_MS = 220;
const SHOOT_RANGE = 80;
const BODY_DAMAGE = 24;
const HEAD_DAMAGE = 65;
const GRENADE_MAX_CHARGES = 1;
const GRENADE_RECHARGE_MS = 8000;
const GRENADE_THROW_SPEED = 13;

// ---------- DOM ----------
const menuEl = document.getElementById('menu');
const hudEl = document.getElementById('hud');
const nameInput = document.getElementById('nameInput');
const playBtn = document.getElementById('playBtn');
const healthFill = document.getElementById('healthFill');
const healthText = document.getElementById('healthText');
const grenadeCountEl = document.getElementById('grenadeCount');
const scoreboardEl = document.getElementById('scoreboard');
const killfeedEl = document.getElementById('killfeed');
const flashOverlay = document.getElementById('flashOverlay');
const deathOverlay = document.getElementById('deathOverlay');
const respawnTimerEl = document.getElementById('respawnTimer');

// ---------- three.js setup ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ec9ff);
scene.fog = new THREE.Fog(0x8ec9ff, 30, 90);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(30, 40, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -40; sun.shadow.camera.right = 40;
sun.shadow.camera.top = 40; sun.shadow.camera.bottom = -40;
scene.add(sun);

// ---------- arena ----------
const ARENA_HALF_SIZE_DEFAULT = 24;
let arenaHalfSize = ARENA_HALF_SIZE_DEFAULT;

const groundGeo = new THREE.PlaneGeometry(200, 200);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x5f8a4d });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const obstacles = []; // { mesh, box (THREE.Box3) }
function addObstacle(x, z, w, h, d, color = 0x8a7a63) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  const box = new THREE.Box3().setFromObject(mesh);
  obstacles.push({ mesh, box });
}

// simple arena layout: perimeter-ish cover boxes
addObstacle(0, 0, 4, 2.2, 4, 0x996633);
addObstacle(10, 6, 3, 1.8, 3);
addObstacle(-10, -6, 3, 1.8, 3);
addObstacle(-8, 8, 2.5, 2.5, 2.5);
addObstacle(8, -8, 2.5, 2.5, 2.5);
addObstacle(0, 14, 6, 2, 2);
addObstacle(0, -14, 6, 2, 2);
addObstacle(14, 0, 2, 2, 6);
addObstacle(-14, 0, 2, 2, 6);

// perimeter walls
function addWall(x, z, w, d) {
  addObstacle(x, z, w, 4, d, 0x444455);
}
addWall(0, arenaHalfSize, arenaHalfSize * 2, 1);
addWall(0, -arenaHalfSize, arenaHalfSize * 2, 1);
addWall(arenaHalfSize, 0, 1, arenaHalfSize * 2);
addWall(-arenaHalfSize, 0, 1, arenaHalfSize * 2);

// ---------- name sprite helper ----------
function makeNameSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.fillText(text.slice(0, 16), canvas.width / 2, 42);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2, 0.5, 1);
  sprite.position.y = PLAYER_HEIGHT + 0.5;
  return sprite;
}

function colorForId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return new THREE.Color(`hsl(${hue}, 70%, 55%)`);
}

// ---------- remote players ----------
const remotePlayers = new Map(); // id -> { group, mesh, nameSprite, target:{x,y,z,yaw}, data }

function createRemotePlayer(p) {
  const group = new THREE.Group();
  const geo = new THREE.CapsuleGeometry(PLAYER_RADIUS, PLAYER_HEIGHT - PLAYER_RADIUS * 2, 4, 8);
  const mat = new THREE.MeshStandardMaterial({ color: colorForId(p.id) });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = PLAYER_HEIGHT / 2;
  mesh.castShadow = true;
  group.add(mesh);
  const nameSprite = makeNameSprite(p.name || 'Player');
  group.add(nameSprite);
  group.position.set(p.x, 0, p.z);
  scene.add(group);
  const entry = { group, mesh, nameSprite, target: { x: p.x, y: p.y, z: p.z, yaw: p.yaw }, data: p };
  remotePlayers.set(p.id, entry);
  return entry;
}

function removeRemotePlayer(id) {
  const entry = remotePlayers.get(id);
  if (!entry) return;
  scene.remove(entry.group);
  remotePlayers.delete(id);
}

// ---------- grenades (server-authoritative positions) ----------
const grenadeMeshes = new Map(); // id -> mesh
const grenadeGeo = new THREE.SphereGeometry(0.12, 10, 10);
const grenadeMat = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0x222222 });

function syncGrenades(list) {
  const seen = new Set();
  for (const g of list) {
    seen.add(g.id);
    let mesh = grenadeMeshes.get(g.id);
    if (!mesh) {
      mesh = new THREE.Mesh(grenadeGeo, grenadeMat);
      scene.add(mesh);
      grenadeMeshes.set(g.id, mesh);
    }
    mesh.position.set(g.x, g.y, g.z);
  }
  for (const [id, mesh] of grenadeMeshes) {
    if (!seen.has(id)) {
      scene.remove(mesh);
      grenadeMeshes.delete(id);
    }
  }
}

// ---------- explosion fx ----------
const explosionFx = [];
function spawnExplosion(pos) {
  const geo = new THREE.SphereGeometry(0.3, 16, 16);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(pos.x, pos.y, pos.z);
  scene.add(mesh);
  explosionFx.push({ mesh, start: performance.now() });

  const light = new THREE.PointLight(0xffffff, 6, 30);
  light.position.copy(mesh.position);
  scene.add(light);
  explosionFx.push({ light, start: performance.now(), isLight: true });
}

function updateExplosionFx(now) {
  for (let i = explosionFx.length - 1; i >= 0; i--) {
    const fx = explosionFx[i];
    const t = (now - fx.start) / 500;
    if (t >= 1) {
      if (fx.mesh) scene.remove(fx.mesh);
      if (fx.light) scene.remove(fx.light);
      explosionFx.splice(i, 1);
      continue;
    }
    if (fx.mesh) {
      fx.mesh.scale.setScalar(1 + t * 14);
      fx.mesh.material.opacity = 1 - t;
    }
    if (fx.light) {
      fx.light.intensity = 6 * (1 - t);
    }
  }
}

// ---------- local player state ----------
let myId = null;
let myName = 'Player';
const local = {
  pos: new THREE.Vector3(0, PLAYER_HEIGHT, 0),
  vel: new THREE.Vector3(0, 0, 0),
  yaw: 0,
  pitch: 0,
  onGround: true,
  alive: true,
  health: MAX_HEALTH,
  blindUntil: 0,
  blindIntensity: 0,
  grenadeCharges: GRENADE_MAX_CHARGES,
  grenadeRechargeAt: 0,
  lastShotAt: 0,
};

const keys = new Set();
window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code === 'KeyG') tryThrowGrenade();
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

let pointerLocked = false;
renderer.domElement.addEventListener('click', () => {
  if (!started) return;
  renderer.domElement.requestPointerLock();
});
document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === renderer.domElement;
});
document.addEventListener('mousemove', (e) => {
  if (!pointerLocked || !local.alive) return;
  const sensitivity = 0.0022;
  local.yaw -= e.movementX * sensitivity;
  local.pitch -= e.movementY * sensitivity;
  const limit = Math.PI / 2 - 0.05;
  local.pitch = Math.max(-limit, Math.min(limit, local.pitch));
});
document.addEventListener('mousedown', (e) => {
  if (!pointerLocked || !local.alive) return;
  if (e.button === 0) tryShoot();
});

function forwardVector(yaw, pitch) {
  return new THREE.Vector3(
    -Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch)
  );
}

// ---------- networking ----------
const socket = io();
let started = false;

socket.on('init', (data) => {
  myId = data.id;
  arenaHalfSize = data.arenaHalfSize;
  for (const p of data.players) {
    if (p.id === myId) {
      local.pos.set(p.x, p.y, p.z);
      local.health = p.health;
      local.alive = p.alive;
    } else {
      createRemotePlayer(p);
    }
  }
});

socket.on('player_joined', (p) => {
  if (p.id === myId) return;
  createRemotePlayer(p);
  pushKillfeed(`${p.name} joined`);
});

socket.on('player_left', ({ id }) => {
  const entry = remotePlayers.get(id);
  if (entry) pushKillfeed(`${entry.data.name} left`);
  removeRemotePlayer(id);
});

socket.on('state', (snapshot) => {
  for (const p of snapshot.players) {
    if (p.id === myId) {
      local.health = p.health;
      local.alive = p.alive;
      local.blindUntil = p.blindUntil;
      local.blindIntensity = p.blindIntensity;
      continue;
    }
    let entry = remotePlayers.get(p.id);
    if (!entry) entry = createRemotePlayer(p);
    entry.data = p;
    entry.target.x = p.x; entry.target.y = p.y; entry.target.z = p.z; entry.target.yaw = p.yaw;
  }
  updateScoreboard(snapshot.players);
  syncGrenades(snapshot.grenades);
});

socket.on('explosion', (pos) => spawnExplosion(pos));

socket.on('hit', ({ shooterId, targetId, damage, headshot }) => {
  if (shooterId === myId) showHitmarker(headshot);
});

socket.on('kill', ({ killerId, victimId }) => {
  const killerName = killerId === myId ? myName : (remotePlayers.get(killerId)?.data.name || 'Someone');
  const victimName = victimId === myId ? myName : (remotePlayers.get(victimId)?.data.name || 'Someone');
  pushKillfeed(`${killerName} ⚡ ${victimName}`);
  if (victimId === myId) showDeathOverlay();
});

socket.on('respawn', ({ id, x, y, z }) => {
  if (id === myId) {
    local.pos.set(x, y, z);
    local.vel.set(0, 0, 0);
    hideDeathOverlay();
  } else {
    const entry = remotePlayers.get(id);
    if (entry) { entry.target.x = x; entry.target.y = y; entry.target.z = z; }
  }
});

// ---------- gameplay actions ----------
const raycaster = new THREE.Raycaster();
function tryShoot() {
  const now = performance.now();
  if (now - local.lastShotAt < FIRE_COOLDOWN_MS) return;
  local.lastShotAt = now;

  raycaster.set(camera.position, camera.getWorldDirection(new THREE.Vector3()));
  raycaster.far = SHOOT_RANGE;

  const targets = [];
  const meshToId = new Map();
  for (const [id, entry] of remotePlayers) {
    targets.push(entry.mesh);
    meshToId.set(entry.mesh, id);
  }
  const obstacleMeshes = obstacles.map((o) => o.mesh);

  const hits = raycaster.intersectObjects([...targets, ...obstacleMeshes], false)
    .sort((a, b) => a.distance - b.distance);

  if (hits.length === 0) return;
  const first = hits[0];
  const targetId = meshToId.get(first.object);
  if (!targetId) return; // obstacle blocked the shot

  const localY = first.point.y;
  const headshot = localY > PLAYER_HEIGHT * 0.78;
  const damage = headshot ? HEAD_DAMAGE : BODY_DAMAGE;
  socket.emit('shoot', { targetId, damage, headshot });
}

function tryThrowGrenade() {
  if (!local.alive) return;
  const now = performance.now();
  if (local.grenadeCharges <= 0) return;
  local.grenadeCharges -= 1;
  local.grenadeRechargeAt = now + GRENADE_RECHARGE_MS;

  const dir = forwardVector(local.yaw, local.pitch + 0.15);
  const origin = camera.position.clone().addScaledVector(dir, 0.6);
  socket.emit('throw_grenade', {
    x: origin.x, y: origin.y, z: origin.z,
    vx: dir.x * GRENADE_THROW_SPEED,
    vy: dir.y * GRENADE_THROW_SPEED + 2,
    vz: dir.z * GRENADE_THROW_SPEED,
  });
}

// ---------- collision helpers ----------
const tmpSphere = new THREE.Sphere();
function resolveCollisions(pos) {
  tmpSphere.center.set(pos.x, pos.y - PLAYER_HEIGHT / 2 + 0.9, pos.z);
  tmpSphere.radius = PLAYER_RADIUS;
  for (const { box } of obstacles) {
    const closest = new THREE.Vector3(
      Math.max(box.min.x, Math.min(tmpSphere.center.x, box.max.x)),
      Math.max(box.min.y, Math.min(tmpSphere.center.y, box.max.y)),
      Math.max(box.min.z, Math.min(tmpSphere.center.z, box.max.z))
    );
    const diff = tmpSphere.center.clone().sub(closest);
    const dist = diff.length();
    if (dist < tmpSphere.radius && dist > 1e-5) {
      const push = diff.normalize().multiplyScalar(tmpSphere.radius - dist);
      pos.x += push.x;
      pos.z += push.z;
    }
  }
  const half = arenaHalfSize - PLAYER_RADIUS - 0.6;
  pos.x = Math.max(-half, Math.min(half, pos.x));
  pos.z = Math.max(-half, Math.min(half, pos.z));
}

// ---------- HUD ----------
function updateHealthHud() {
  const pct = Math.max(0, local.health) / MAX_HEALTH * 100;
  healthFill.style.width = `${pct}%`;
  healthText.textContent = Math.max(0, Math.round(local.health));
}

function updateGrenadeHud(now) {
  if (local.grenadeCharges < GRENADE_MAX_CHARGES && now >= local.grenadeRechargeAt) {
    local.grenadeCharges = Math.min(GRENADE_MAX_CHARGES, local.grenadeCharges + 1);
  }
  grenadeCountEl.textContent = local.grenadeCharges;
}

function updateScoreboard(players) {
  const sorted = [...players].sort((a, b) => b.kills - a.kills);
  scoreboardEl.innerHTML = sorted.map((p) => {
    const cls = p.id === myId ? 'row me' : 'row';
    return `<div class="${cls}"><span>${escapeHtml(p.name)}</span><span>${p.kills}/${p.deaths}</span></div>`;
  }).join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function pushKillfeed(text) {
  const div = document.createElement('div');
  div.className = 'entry';
  div.textContent = text;
  killfeedEl.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

function showHitmarker() {
  const crosshair = document.getElementById('crosshair');
  crosshair.style.filter = 'drop-shadow(0 0 4px red)';
  setTimeout(() => { crosshair.style.filter = ''; }, 120);
}

let deathOverlayTimer = null;
function showDeathOverlay() {
  deathOverlay.classList.remove('hidden');
  let remaining = RESPAWN_DELAY_MS / 1000;
  respawnTimerEl.textContent = `Respawning in ${remaining.toFixed(1)}s`;
  clearInterval(deathOverlayTimer);
  deathOverlayTimer = setInterval(() => {
    remaining -= 0.1;
    respawnTimerEl.textContent = `Respawning in ${Math.max(0, remaining).toFixed(1)}s`;
    if (remaining <= 0) clearInterval(deathOverlayTimer);
  }, 100);
}
function hideDeathOverlay() {
  deathOverlay.classList.add('hidden');
  clearInterval(deathOverlayTimer);
}

function updateFlashOverlay() {
  const now = Date.now();
  if (now < local.blindUntil && local.blindIntensity > 0) {
    const total = local.blindUntil - now;
    const remaining = Math.max(0, total);
    const fade = Math.min(1, remaining / 800);
    flashOverlay.style.opacity = String(local.blindIntensity * Math.min(1, fade + 0.15));
  } else {
    flashOverlay.style.opacity = '0';
  }
}

// ---------- main loop ----------
let lastFrame = performance.now();
let lastNetSend = 0;

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;

  if (started && local.alive) {
    handleMovement(dt);
  }

  for (const entry of remotePlayers.values()) {
    entry.group.position.x += (entry.target.x - entry.group.position.x) * Math.min(1, dt * 12);
    entry.group.position.z += (entry.target.z - entry.group.position.z) * Math.min(1, dt * 12);
    entry.group.rotation.y += (entry.target.yaw - entry.group.rotation.y) * Math.min(1, dt * 10);
  }

  updateExplosionFx(now);
  updateHealthHud();
  updateGrenadeHud(now);
  updateFlashOverlay();

  if (started && now - lastNetSend > 45) {
    lastNetSend = now;
    socket.emit('move', { x: local.pos.x, y: local.pos.y, z: local.pos.z, yaw: local.yaw, pitch: local.pitch });
  }

  camera.position.copy(local.pos);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = local.yaw;
  camera.rotation.x = local.pitch;

  renderer.render(scene, camera);
}

function handleMovement(dt) {
  const forward = new THREE.Vector3(-Math.sin(local.yaw), 0, -Math.cos(local.yaw));
  const right = new THREE.Vector3(-forward.z, 0, forward.x);
  const move = new THREE.Vector3();
  if (keys.has('KeyW')) move.add(forward);
  if (keys.has('KeyS')) move.sub(forward);
  if (keys.has('KeyD')) move.add(right);
  if (keys.has('KeyA')) move.sub(right);
  if (move.lengthSq() > 0) move.normalize();

  const speedMul = local.blindIntensity > 0.4 && Date.now() < local.blindUntil ? 0.55 : 1;
  local.vel.x = move.x * MOVE_SPEED * speedMul;
  local.vel.z = move.z * MOVE_SPEED * speedMul;

  if (keys.has('Space') && local.onGround) {
    local.vel.y = JUMP_SPEED;
    local.onGround = false;
  }
  local.vel.y += GRAVITY * dt;

  local.pos.x += local.vel.x * dt;
  local.pos.z += local.vel.z * dt;
  local.pos.y += local.vel.y * dt;

  if (local.pos.y <= PLAYER_HEIGHT) {
    local.pos.y = PLAYER_HEIGHT;
    local.vel.y = 0;
    local.onGround = true;
  }

  resolveCollisions(local.pos);
}

// ---------- start ----------
playBtn.addEventListener('click', startGame);
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') startGame(); });

function startGame() {
  if (started) return;
  myName = nameInput.value.trim().slice(0, 16) || `Player-${Math.floor(Math.random() * 1000)}`;
  socket.emit('set_name', myName);
  menuEl.classList.add('hidden');
  hudEl.classList.remove('hidden');
  started = true;
  renderer.domElement.requestPointerLock();
}

animate();
