// track.js — Schimmel Paniek Baan

const TRACK = {
  name: 'Schimmel Paniek Baan',
  music: 'Audio/SchimmelPaniekBaan.mp3',
  laps: 3,
  trackWidth: 12,
  decorModels: {
    tree: 'Models/Tree.glb',
    rock: 'Models/Rock.glb',
  }
};

let trackMesh = null;
let trackCurve = null;
let trackAudio = null;
let decorObjects = [];

// ── Baanpunten gebaseerd op de plattegrond (top-down, XZ vlak) ──
// Punt (0,0) = start/finish onderaan midden
function buildTrackPoints() {
  return [
    // Start/finish onderaan midden
    new THREE.Vector3(  0,   0,  60),
    // Rechts naar beneden, S-bocht onderkant
    new THREE.Vector3( 30,   0,  55),
    new THREE.Vector3( 55,   0,  40),
    new THREE.Vector3( 60,   0,  15),
    // Rechterbocht groot (rechtsonder)
    new THREE.Vector3( 55,   0, -10),
    new THREE.Vector3( 40,   0, -30),
    // S-bocht midden rechts omhoog
    new THREE.Vector3( 20,   0, -20),
    new THREE.Vector3(  0,   0, -30),
    new THREE.Vector3(-15,   0, -20),
    // Rechtsboven knob
    new THREE.Vector3(-10,   0,  10),
    new THREE.Vector3(  5,   0,  20),
    new THREE.Vector3( 10,   0,  35),
    // Linker bobbel bovenaan
    new THREE.Vector3(  0,   0,  45),
    new THREE.Vector3(-15,   0,  50),
    new THREE.Vector3(-30,   0,  45),
    new THREE.Vector3(-35,   0,  30),
    // Linkerbocht groot
    new THREE.Vector3(-55,   0,  20),
    new THREE.Vector3(-65,   0,   0),
    new THREE.Vector3(-55,   0, -20),
    // Linksonder terugkeer
    new THREE.Vector3(-30,   0, -30),
    new THREE.Vector3(-10,   0, -15),
    // Terug naar start
    new THREE.Vector3( -5,   0,  30),
    new THREE.Vector3(  0,   0,  60), // sluit de lus
  ];
}

// ── Bouw het baanmesh ──
function buildTrack(scene) {
  const points = buildTrackPoints();
  trackCurve = new THREE.CatmullRomCurve3(points, true);

  const tubeSegments = 300;
  const w = TRACK.trackWidth;

  // Genereer baanvlak als lint
  const path = trackCurve.getPoints(tubeSegments);
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= tubeSegments; i++) {
    const t = i / tubeSegments;
    const pt = trackCurve.getPointAt(t);
    const tan = trackCurve.getTangentAt(t).normalize();
    const right = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

    const l = pt.clone().addScaledVector(right, -w / 2);
    const r = pt.clone().addScaledVector(right,  w / 2);

    positions.push(l.x, l.y, l.z, r.x, r.y, r.z);
    uvs.push(0, t * 20, 1, t * 20);

    if (i < tubeSegments) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      indices.push(a, b, c, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  // Asfalt textuur via canvas
  const texCanvas = document.createElement('canvas');
  texCanvas.width = 128; texCanvas.height = 128;
  const ctx = texCanvas.getContext('2d');
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#ffffff44';
  ctx.lineWidth = 4;
  ctx.setLineDash([20, 20]);
  ctx.beginPath(); ctx.moveTo(64, 0); ctx.lineTo(64, 128); ctx.stroke();
  const tex = new THREE.CanvasTexture(texCanvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;

  const mat = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide });
  trackMesh = new THREE.Mesh(geo, mat);
  scene.add(trackMesh);

  // ── Gras ondergrond ──
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshLambertMaterial({ color: 0x3a7d2c })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  scene.add(ground);

  // ── Start/finish lijn ──
  buildStartLine(scene);

  // ── Decor ──
  loadDecor(scene);

  // ── Audio ──
  startTrackMusic();

  return trackCurve;
}

function buildStartLine(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const size = 16;
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#fff' : '#000';
      ctx.fillRect(x * size, y * size, size, size);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(TRACK.trackWidth, 4),
    new THREE.MeshLambertMaterial({ map: tex })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.01, 60);
  scene.add(mesh);
}

// ── Decor: bomen en stenen langs baan ──
function loadDecor(scene) {
  const loader = new THREE.GLTFLoader ? new THREE.GLTFLoader() : null;
  if (!loader) { console.warn('GLTFLoader niet beschikbaar'); return; }

  const decorData = generateDecorPositions();

  decorData.forEach(({ model, pos, scale, rot }) => {
    loader.load(
      TRACK.decorModels[model],
      (gltf) => {
        const obj = gltf.scene;
        obj.position.set(pos.x, 0, pos.z);
        obj.scale.setScalar(scale);
        obj.rotation.y = rot;
        scene.add(obj);
        decorObjects.push(obj);
      },
      undefined,
      () => {
        // Fallback: simpele placeholder
        const fallback = new THREE.Mesh(
          model === 'tree'
            ? new THREE.ConeGeometry(1, 3, 6)
            : new THREE.DodecahedronGeometry(0.8),
          new THREE.MeshLambertMaterial({ color: model === 'tree' ? 0x2d6e2d : 0x888888 })
        );
        fallback.position.set(pos.x, 1, pos.z);
        fallback.rotation.y = rot;
        scene.add(fallback);
        decorObjects.push(fallback);
      }
    );
  });
}

function generateDecorPositions() {
  const decor = [];
  const segments = 80;
  const w = TRACK.trackWidth;

  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const pt = trackCurve.getPointAt(t);
    const tan = trackCurve.getTangentAt(t).normalize();
    const right = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

    // Wissel boom/steen
    const model = i % 3 === 0 ? 'rock' : 'tree';
    const offset = w / 2 + 3 + Math.random() * 4;
    const side = Math.random() > 0.5 ? 1 : -1;

    decor.push({
      model,
      pos: {
        x: pt.x + right.x * offset * side,
        z: pt.z + right.z * offset * side
      },
      scale: 0.8 + Math.random() * 0.8,
      rot: Math.random() * Math.PI * 2
    });
  }

  return decor;
}

// ── Muziek ──
function startTrackMusic() {
  if (trackAudio) { trackAudio.pause(); trackAudio = null; }
  trackAudio = new Audio(TRACK.music);
  trackAudio.loop = true;
  trackAudio.volume = 0.5;
  trackAudio.play().catch(() => {
    // Wacht op eerste interactie
    document.addEventListener('keydown', () => trackAudio.play(), { once: true });
  });
}

function stopTrackMusic() {
  if (trackAudio) { trackAudio.pause(); trackAudio.currentTime = 0; }
}

// ── Exporteer voor main.js ──
function getTrackCurve() { return trackCurve; }
function getTrackWidth() { return TRACK.trackWidth; }
