import * as THREE from 'https://unpkg.com/three@0.162.0/build/three.module.js';

const canvas = document.getElementById('game');
const playerHpEl = document.getElementById('playerHp');
const enemyHpEl = document.getElementById('enemyHp');
const logEl = document.getElementById('log');

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x070b16, 10, 45);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 10, 13);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

scene.add(new THREE.HemisphereLight(0xbfd9ff, 0x1b1f2f, 0.9));
const dir = new THREE.DirectionalLight(0xffffff, 1.1);
dir.position.set(6, 10, 2);
scene.add(dir);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(14, 64),
  new THREE.MeshStandardMaterial({ color: 0x0d1a2e, roughness: 0.8 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const ring = new THREE.Mesh(
  new THREE.RingGeometry(12.2, 12.6, 64),
  new THREE.MeshBasicMaterial({ color: 0x28456f, side: THREE.DoubleSide })
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.01;
scene.add(ring);

function makeFighter(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.45, 1.0, 4, 8),
    new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.4 })
  );
  body.position.y = 1.0;
  g.add(body);

  const sword = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 1.45),
    new THREE.MeshStandardMaterial({ color: 0xd5dde9, metalness: 0.9, roughness: 0.2 })
  );
  sword.position.set(0.42, 1.1, 0.4);
  sword.rotation.x = Math.PI / 2;
  g.add(sword);

  return { g, sword };
}

const p = makeFighter(0x57c7ff);
const e = makeFighter(0xff6a81);
p.g.position.set(-2, 0, 0);
e.g.position.set(2, 0, 0);
scene.add(p.g, e.g);

const state = {
  playerHp: 100,
  enemyHp: 100,
  playerGuard: false,
  enemyGuard: false,
  playerParryUntil: 0,
  enemyAtkUntil: 0,
  playerAtkUntil: 0,
  enemyDecisionAt: 0,
  enemyWindupUntil: 0,
  enemyAtkType: 'light',
  gameOver: false,
};

const keys = new Set();
window.addEventListener('keydown', (ev) => {
  keys.add(ev.code);
  if (ev.code === 'KeyJ') playerAttack('light');
  if (ev.code === 'KeyK') playerAttack('heavy');
  if (ev.code === 'KeyL') {
    state.playerGuard = true;
    state.playerParryUntil = performance.now() + 180;
  }
});
window.addEventListener('keyup', (ev) => {
  keys.delete(ev.code);
  if (ev.code === 'KeyL') state.playerGuard = false;
});

function announce(text) {
  logEl.textContent = text;
}

function facing(from, to) {
  const d = new THREE.Vector3().subVectors(to.position, from.position);
  from.lookAt(to.position.x, from.position.y, to.position.z);
  return d.length();
}

function hit(attacker, defender, type, defenderGuard, canParry) {
  const dist = attacker.position.distanceTo(defender.position);
  const range = type === 'heavy' ? 2.2 : 1.8;
  if (dist > range) return false;

  if (defenderGuard) {
    if (canParry) {
      announce('弹反成功！反击窗口开启');
      return 'parry';
    }
    announce('格挡成功，伤害减免');
    return 'guard';
  }
  return true;
}

function damage(type) {
  return type === 'heavy' ? 22 : 12;
}

function playerAttack(type) {
  if (state.gameOver) return;
  const now = performance.now();
  if (now < state.playerAtkUntil) return;
  state.playerAtkUntil = now + (type === 'heavy' ? 700 : 380);
  p.sword.rotation.z = type === 'heavy' ? 1.2 : 0.7;

  const result = hit(p.g, e.g, type, state.enemyGuard, false);
  if (!result) return;
  if (result === 'guard') {
    state.enemyHp = Math.max(0, state.enemyHp - Math.floor(damage(type) * 0.2));
  } else {
    state.enemyHp = Math.max(0, state.enemyHp - damage(type));
    announce(type === 'heavy' ? '重斩命中！' : '轻斩命中！');
  }
}

function enemyAttack() {
  const now = performance.now();
  if (now < state.enemyAtkUntil || now < state.enemyWindupUntil || state.gameOver) return;

  const dist = e.g.position.distanceTo(p.g.position);
  if (dist > 2.3) return;
  state.enemyAtkType = Math.random() > 0.68 ? 'heavy' : 'light';
  state.enemyWindupUntil = now + (state.enemyAtkType === 'heavy' ? 350 : 180);
  state.enemyAtkUntil = now + (state.enemyAtkType === 'heavy' ? 1100 : 700);
}

function resolveEnemyAttack(now) {
  if (state.enemyWindupUntil === 0 || now < state.enemyWindupUntil) return;

  const canParry = now <= state.playerParryUntil;
  const result = hit(e.g, p.g, state.enemyAtkType, state.playerGuard, canParry);
  state.enemyWindupUntil = 0;

  if (!result) return;
  if (result === 'parry') {
    state.enemyHp = Math.max(0, state.enemyHp - 18);
    return;
  }
  if (result === 'guard') {
    state.playerHp = Math.max(0, state.playerHp - Math.floor(damage(state.enemyAtkType) * 0.18));
    return;
  }
  state.playerHp = Math.max(0, state.playerHp - damage(state.enemyAtkType));
  announce(state.enemyAtkType === 'heavy' ? '你被重斩命中！' : '你被轻斩命中！');
}

function updateEnemyAI(now) {
  if (now < state.enemyDecisionAt || state.gameOver) return;
  state.enemyDecisionAt = now + 120;

  const dist = e.g.position.distanceTo(p.g.position);
  state.enemyGuard = dist < 2.4 && Math.random() > 0.75;
  if (state.enemyGuard) return;

  if (dist > 1.9) {
    const move = new THREE.Vector3().subVectors(p.g.position, e.g.position).setY(0).normalize().multiplyScalar(0.03);
    e.g.position.add(move);
  } else {
    enemyAttack();
  }
}

function updatePlayerMovement() {
  if (state.gameOver) return;
  const speed = keys.has('ShiftLeft') ? 0.1 : 0.06;
  const dir = new THREE.Vector3();
  if (keys.has('KeyW')) dir.z -= 1;
  if (keys.has('KeyS')) dir.z += 1;
  if (keys.has('KeyA')) dir.x -= 1;
  if (keys.has('KeyD')) dir.x += 1;
  if (dir.lengthSq() === 0) return;
  dir.normalize().multiplyScalar(speed);
  p.g.position.add(dir);

  if (p.g.position.length() > 11.4) p.g.position.setLength(11.4);
}

function updateHUD() {
  playerHpEl.style.width = `${state.playerHp}%`;
  enemyHpEl.style.width = `${state.enemyHp}%`;
}

function checkEnd() {
  if (state.gameOver) return;
  if (state.playerHp <= 0 || state.enemyHp <= 0) {
    state.gameOver = true;
    announce(state.enemyHp <= 0 ? '胜利！你斩杀了恶鬼。刷新页面再战。' : '落败... 刷新页面重试。');
  }
}

function animate(now) {
  requestAnimationFrame(animate);

  updatePlayerMovement();
  updateEnemyAI(now);
  resolveEnemyAttack(now);

  facing(p.g, e.g);
  facing(e.g, p.g);

  p.sword.rotation.z *= 0.86;
  e.sword.rotation.z = Math.sin(now * 0.008) * 0.2;

  updateHUD();
  checkEnd();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

announce('战斗开始：仅刀战系统（无其他武器）');
animate(performance.now());
