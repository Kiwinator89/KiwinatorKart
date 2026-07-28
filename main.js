// main.js — Setup & gameloop

let scene, camera, renderer, clock;
let gameRunning = false;
let lapCount = 0;
const TOTAL_LAPS = 3;

// ── Three.js init ──
function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 80, 220);

  camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 500);
  camera.position.set(0, 8, 74);

  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('game-canvas'),
    antialias: true
  });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  // Verlichting
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xfff4cc, 1.2);
  sun.position.set(80, 120, 60);
  sun.castShadow = true;
  scene.add(sun);

  clock = new THREE.Clock();
  window.addEventListener('resize', onResize);
}

function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

// ── UI navigatie ──
function showMenu() {
  document.getElementById('main-menu').style.display = 'flex';
  document.getElementById('char-select').style.display = 'none';
}

function showCharSelect() {
  initCharSelect();
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('char-select').style.display = 'flex';
}

function showOptions() {
  alert('Opties komen nog!');
}

function startRace() {
  document.getElementById('char-select').style.display = 'none';
  document.getElementById('hud').style.display = 'block';

  const char = getSelectedCharacter();
  buildTrack(scene);
  initKart(scene, char, camera);
  initUI();

  gameRunning = true;
  lapCount = 0;
  updateHUDLap();
  gameLoop();
}

// ── Gameloop ──
let lastTime = 0;
function gameLoop(ts = 0) {
  if (!gameRunning) return;
  requestAnimationFrame(gameLoop);

  const delta = clock.getDelta();

  // Update kart
  const kartState = updateKart(delta);

  // Camera
  updateCamera(camera);

  // HUD
  if (kartState) updateHUD(kartState);

  if (kartState) {
    const pos = getKartPosition();
    const heading = getKartHeading();
    const finished = updateUI(kartState, pos, heading);
    if (finished) gameRunning = false;
  }

  renderer.render(scene, camera);
}

// ── HUD updates ──
function updateHUD({ speed, maxSpeed, drifting }) {
  const kmh = Math.round(Math.abs(speed) / maxSpeed * 180);
  document.getElementById('speedometer').innerHTML = `${kmh} <span>km/h</span>`;
  if (drifting) {
    document.getElementById('speedometer').style.color = '#ff6b35';
  } else {
    document.getElementById('speedometer').style.color = '#ffe94d';
  }
}

function updateHUDLap() {
  document.getElementById('hud-lap').textContent = `Ronde ${lapCount + 1} / ${TOTAL_LAPS}`;
}

// ── Boot: laadscherm → menu ──
window.addEventListener('load', () => {
  initThree();

  // Fake laadbar
  const bar = document.getElementById('loading-bar');
  const txt = document.getElementById('loading-text');
  const msgs = ['Baan laden...', 'Karts poetsen...', 'Schimmels kweken...', 'Klaar!'];
  let p = 0;
  const interval = setInterval(() => {
    p += Math.random() * 22 + 8;
    if (p >= 100) { p = 100; clearInterval(interval); finishLoading(); }
    bar.style.width = p + '%';
    txt.textContent = msgs[Math.floor(p / 26)] || 'Klaar!';
  }, 280);
});

function finishLoading() {
  setTimeout(() => {
    document.getElementById('loading').style.display = 'none';
    showMenu();
  }, 400);
}
