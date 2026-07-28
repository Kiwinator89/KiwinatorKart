
Gemini
Chat converteren naar PDF
Chat converteren naar PDF
Open deze chat in Acrobat
Nieuw gesprek
Zoeken in gesprekken
Afbeeldingen
Bibliotheek
Nieuwe notebook
Vereenvoudigde Baan Lay-out Verbeterd
Monkey Tilting Left 45 Degrees
Lettertype van 'Five Nights At Meester Gijs'
Prompt Verbetering voor Krantenafbeelding
Spin-monster genereren zonder persoon
Gedetailleerde Beschrijving Van Een Zittende Beer
Debugging JavaScript Button Errors
Tsjaad TD: Paragon & Bugfixes Implementatie
Game Aanpassingen en Bugfixes
Grammaticale Feedback Engelse Poster
maak dit monster langere benen en armen
kan je een tekst maken in deze stijl maar dan met de text Five Nights At Meester Gijs 2
Tower Defense Game Visual Enhancements
maak de kwaliteit van deze afbeelding wat lager
Man Loopt Cel Binnen Afbeelding
Foto Genereren: Twee Mannen Naast Elkaar
Meestergijs Toevoegen Aan Afbeelding
Video-idee en Afbeeldingen Aanbod

Activiteit
Duiven, Nederland
Op basis van je IP-adres
Locatie updaten
Gesprek met Gemini
Vervang de track met een veel simpelere layout. De grijze stipjes zijn stenen de oranje zijn bomen en de rode lijnen zijn checkpoints 1 tot en met 4. Kies een logische schaal met de auto en de baan                       

Het is me gelukt om de baan aan te passen naar een veel simpelere ovaalvormige lay-out. Ik heb de schaal van de auto en de baan verbeterd voor een logischer beeld. De stenen zijn nu grijze rotsen, de oranje stippen zijn bomen geworden en de rode lijnen markeren de checkpoints 1 tot en met 4.
, AI-gegenereerd


Afbeelding bewerken
pas de code aan van dit bestand om een 3d baan te maken

Your JS file is ready
JS-icoon
track
 JS 
Openen

Hier is de aangepaste track.js code waarin de ingewikkelde baan is vervangen door een overzichtelijke 3D ovaal/stadium layout, inclusief de 4 checkpoints en de juiste decoraties (oranje bomen en grijze stenen).

Belangrijkste aanpassingen in de code:
Vereenvoudigde 3D Baan-layout (buildTrackPoints): De 23 complexe baanpunten zijn vervangen door een symmetrische ovaal-layout met vloeiende bochten en rechte stukken.

4 Checkpoints (CHECKPOINT_T & buildCheckpoints):

Uitgebreid van 3 naar 4 rode checkpoint-poorten verdeeld over de baan (op 20%, 42%, 65% en 85% van het circuit).

checkpointState en updateCheckpoints() zijn bijgewerkt om alle 4 de checkpoints in volgorde te verifiëren voordat een ronde wordt geteld.

Correcte Decoraties (generateDecorPositions & createFallbackDecor):

Grijze stenen: Getekend als grijze rotsen (0x888888).

Oranje bomen: Getekend met een stam en een oranje bladerdak (0xff6600).

Posities zijn verdeeld in het binnenveld en rondom het buitenveld zoals aangegeven op de plattegrond.

Schalering: De baanbreedte (trackWidth: 320) en checkpointafmetingen zijn afgestemd op een logische verhouding ten opzichte van de speler/kart.

Volledige track.js code:
JavaScript
// track.js — Schimmel Paniek Baan (Vereenvoudigde 3D Ovaal Layout)

const TRACK = {
  name: 'Schimmel Paniek Baan',
  music: 'Audio/SchimmelPaniekBaan.mp3',
  laps: 3,
  trackWidth: 320,
  decorModels: {
    tree: 'Models/Tree.glb',
    rock: 'Models/Rock.glb',
  }
};

let trackMesh = null;
let trackCurve = null;
let trackAudio = null;
let decorObjects = [];

// ── Baanpunten voor een overzichtelijke, symmetrische 3D ovaal-layout ──
function buildTrackPoints() {
  return [
    // Start / Finish (onderaan rechts)
    new THREE.Vector3(  600, 0,  1000),
    // Checkpoint 1 (onderaan midden)
    new THREE.Vector3( -200, 0,  1000),
    new THREE.Vector3( -800, 0,  1000),
    // Linker bocht (voor & bij Checkpoint 2)
    new THREE.Vector3(-1400, 0,   600),
    new THREE.Vector3(-1400, 0,     0), // Checkpoint 2
    new THREE.Vector3(-1400, 0,  -600),
    // Bovenste recht stuk (Checkpoint 3)
    new THREE.Vector3( -800, 0, -1000),
    new THREE.Vector3(    0, 0, -1000), // Checkpoint 3
    new THREE.Vector3(  800, 0, -1000),
    // Rechter bocht (voor & bij Checkpoint 4)
    new THREE.Vector3( 1400, 0,  -600),
    new THREE.Vector3( 1400, 0,     0), // Checkpoint 4
    new THREE.Vector3( 1400, 0,   600),
    // Terug naar Start/Finish
    new THREE.Vector3(  800, 0,  1000),
  ];
}

// ── Bouw het 3D baanmesh ──
function buildTrack(scene) {
  const points = buildTrackPoints();
  trackCurve = new THREE.CatmullRomCurve3(points, true, 'centripetal');

  const tubeSegments = 300;
  const w = TRACK.trackWidth;

  // Genereer baanvlak als lint
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
    uvs.push(0, t * 25, 1, t * 25);

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
  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#ffffff66';
  ctx.lineWidth = 4;
  ctx.setLineDash([16, 16]);
  ctx.beginPath(); ctx.moveTo(64, 0); ctx.lineTo(64, 128); ctx.stroke();
  const tex = new THREE.CanvasTexture(texCanvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;

  const mat = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide });
  trackMesh = new THREE.Mesh(geo, mat);
  scene.add(trackMesh);

  // ── Gras ondergrond ──
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(8000, 8000),
    new THREE.MeshLambertMaterial({ color: 0x388e3c })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  scene.add(ground);

  // ── Start/Finish lijn ──
  buildStartLine(scene);

  // ── Checkpoints 1 t/m 4 ──
  buildCheckpoints(scene);

  // ── Decor (oranje bomen en grijze stenen) ──
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
      ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#111111';
      ctx.fillRect(x * size, y * size, size, size);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(TRACK.trackWidth, 100),
    new THREE.MeshLambertMaterial({ map: tex })
  );
  mesh.rotation.x = -Math.PI / 2;

  // Lijn op start/finish punt (t = 0)
  const startPt = trackCurve.getPointAt(0);
  const startTan = trackCurve.getTangentAt(0);
  mesh.position.set(startPt.x, 0.02, startPt.z);
  mesh.rotation.z = Math.atan2(startTan.x, startTan.z);
  scene.add(mesh);
}

// ── Checkpoints 1 t/m 4 ──
// t-waarden verdeeld over de 4 secties van de ovaal (20%, 42%, 65%, 85%)
const CHECKPOINT_T = [0.20, 0.42, 0.65, 0.85];
const checkpointMeshes = [];
let checkpointState = { reached: [false, false, false, false], lap: 0 };

function buildCheckpoints(scene) {
  checkpointMeshes.length = 0;

  CHECKPOINT_T.forEach((t, i) => {
    const pt  = trackCurve.getPointAt(t);
    const tan = trackCurve.getTangentAt(t).normalize();
    const right = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

    // Visuele poort: twee rode pilaren met rode bovenbalk (Checkpoint 1 t/m 4)
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0xee2222 });
    const pillarGeo = new THREE.BoxGeometry(10, 50, 10);

    // Pilaren links en rechts van de baan
    [-1, 1].forEach(side => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      const edge = pt.clone().addScaledVector(right, side * (TRACK.trackWidth / 2 + 12));
      pillar.position.set(edge.x, 25, edge.z);
      scene.add(pillar);
    });

    // Bovenbalk over de baan
    const beamGeo = new THREE.BoxGeometry(TRACK.trackWidth + 30, 6, 6);
    const beam = new THREE.Mesh(beamGeo, pillarMat);
    beam.position.set(pt.x, 50, pt.z);
    beam.rotation.y = Math.atan2(tan.x, tan.z);
    scene.add(beam);

    // Opslaan triggervolume
    checkpointMeshes.push({ pos: pt.clone(), tan: tan.clone(), index: i });
  });
}

// Roep dit aan vanuit main.js elke frame met de kartpositie.
function updateCheckpoints(kartPos, kartHeading) {
  const state = checkpointState;
  const result = { lapComplete: false, lap: state.lap, checkpoints: [...state.reached] };

  // Check volgende actieve checkpoint
  const nextIndex = state.reached.indexOf(false);

  if (nextIndex !== -1) {
    const cp = checkpointMeshes[nextIndex];
    const dist = new THREE.Vector2(kartPos.x - cp.pos.x, kartPos.z - cp.pos.z).length();
    if (dist < TRACK.trackWidth * 0.85) {
      state.reached[nextIndex] = true;
      result.checkpoints = [...state.reached];
    }
  } else {
    // Alle 4 checkpoints gehaald — check Finish (t = 0)
    const finishPos = trackCurve.getPointAt(0);
    const distFinish = new THREE.Vector2(kartPos.x - finishPos.x, kartPos.z - finishPos.z).length();

    const finishTan = trackCurve.getTangentAt(0);
    const heading2D = new THREE.Vector2(Math.sin(kartHeading), Math.cos(kartHeading));
    const finishDir = new THREE.Vector2(finishTan.x, finishTan.z);
    const movingCorrectWay = heading2D.dot(finishDir) > 0;

    if (distFinish < TRACK.trackWidth * 0.85 && movingCorrectWay) {
      state.lap++;
      state.reached = [false, false, false, false];
      result.lap = state.lap;
      result.lapComplete = true;
      result.checkpoints = [false, false, false, false];
    }
  }

  return result;
}

function resetCheckpoints() {
  checkpointState = { reached: [false, false, false, false], lap: 0 };
}

// ── Decor: Oranje bomen en grijze stenen ──
function loadDecor(scene) {
  const loader = (typeof THREE !== 'undefined' && THREE.GLTFLoader) ? new THREE.GLTFLoader() : null;
  const decorData = generateDecorPositions();

  decorData.forEach(({ model, pos, scale, rot }) => {
    if (loader) {
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
        () => createFallbackDecor(scene, model, pos, rot)
      );
    } else {
      createFallbackDecor(scene, model, pos, rot);
    }
  });
}

// Fallback visualisaties: Oranje bomen (conisch) en Grijze stenen (dodecaëder)
function createFallbackDecor(scene, model, pos, rot) {
  let mesh;
  if (model === 'tree') {
    // Oranje boom
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 12, 30, 8),
      new THREE.MeshLambertMaterial({ color: 0x5c4033 })
    );
    trunk.position.y = 15;
    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(40, 90, 8),
      new THREE.MeshLambertMaterial({ color: 0xff6600 }) // Oranje bomen
    );
    leaves.position.y = 60;
    group.add(trunk, leaves);
    mesh = group;
  } else {
    // Grijze steen
    mesh = new THREE.Mesh(
      new THREE.DodecahedronGeometry(22, 1),
      new THREE.MeshLambertMaterial({ color: 0x888888 }) // Grijze stenen
    );
    mesh.position.y = 15;
  }

  mesh.position.set(pos.x, mesh.position.y || 0, pos.z);
  mesh.rotation.y = rot;
  scene.add(mesh);
  decorObjects.push(mesh);
}

function generateDecorPositions() {
  const decor = [];

  // Vaste posities binnen- en buitenveld volgens de nieuwe layout
  const setPositions = [
    // Binnenveld (stappen in de lus)
    { model: 'rock', pos: { x: -600, z: 200 } },
    { model: 'rock', pos: { x: -450, z: 250 } },
    { model: 'tree', pos: { x: -200, z: 300 } },
    { model: 'rock', pos: { x: 300, z: -200 } },
    { model: 'tree', pos: { x: 500, z: 100 } },

    // Buitenveld hoeken
    { model: 'rock', pos: { x: -1800, z: 1200 } },
    { model: 'rock', pos: { x: -1650, z: 1300 } },
    { model: 'tree', pos: { x: -1400, z: 1400 } },
    { model: 'tree', pos: { x: 1400, z: 1400 } },
    { model: 'rock', pos: { x: 1700, z: 1250 } },

    { model: 'rock', pos: { x: -1800, z: -1200 } },
    { model: 'tree', pos: { x: -1500, z: -1300 } },
    { model: 'tree', pos: { x: 1500, z: -1300 } },
    { model: 'rock', pos: { x: 1800, z: -1200 } },

    { model: 'tree', pos: { x: -1850, z: 0 } },
    { model: 'tree', pos: { x: 1850, z: 0 } },
  ];

  setPositions.forEach(item => {
    decor.push({
      model: item.model,
      pos: item.pos,
      scale: item.model === 'tree' ? 0.8 : 0.6,
      rot: Math.random() * Math.PI * 2
    });
  });

  // Dynamische random verspreiding langs de buitenranden
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const model = i % 2 === 0 ? 'tree' : 'rock';
    const radiusX = 2000 + Math.random() * 300;
    const radiusZ = 1400 + Math.random() * 300;

    decor.push({
      model,
      pos: {
        x: Math.cos(angle) * radiusX,
        z: Math.sin(angle) * radiusZ
      },
      scale: 0.7 + Math.random() * 0.4,
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
    document.addEventListener('keydown', () => trackAudio.play(), { once: true });
  });
}

function stopTrackMusic() {
  if (trackAudio) { trackAudio.pause(); trackAudio.currentTime = 0; }
}

// ── Exporteer voor main.js ──
function getTrackCurve()       { return trackCurve; }
function getTrackWidth()       { return TRACK.trackWidth; }
Er is op dit moment veel vraag naar Pro
Er is een ander model gebruikt voor deze reactie. Dit telt niet mee voor je limiet.



Gemini is AI en kan fouten maken, ook over mensen. Je privacy en GeminiOpent in een nieuw venster

// track.js — Schimmel Paniek Baan (Vereenvoudigde 3D Ovaal Layout)

const TRACK = {
  name: 'Schimmel Paniek Baan',
  music: 'Audio/SchimmelPaniekBaan.mp3',
  laps: 3,
  trackWidth: 320,
  decorModels: {
    tree: 'Models/Tree.glb',
    rock: 'Models/Rock.glb',
  }
};

let trackMesh = null;
let trackCurve = null;
let trackAudio = null;
let decorObjects = [];

// ── Baanpunten voor een overzichtelijke, symmetrische 3D ovaal-layout ──
// Vormt een vloeiende, afgeronde rechthoek/ovaal passend bij de nieuwe plattegrond
function buildTrackPoints() {
  return [
    // Start / Finish (onderaan rechts)
    new THREE.Vector3(  600, 0,  1000),
    // Checkpoint 1 (onderaan midden)
    new THREE.Vector3( -200, 0,  1000),
    new THREE.Vector3( -800, 0,  1000),
    // Linker bocht (voor & bij Checkpoint 2)
    new THREE.Vector3(-1400, 0,   600),
    new THREE.Vector3(-1400, 0,     0), // Checkpoint 2
    new THREE.Vector3(-1400, 0,  -600),
    // Bovenste recht stuk (Checkpoint 3)
    new THREE.Vector3( -800, 0, -1000),
    new THREE.Vector3(    0, 0, -1000), // Checkpoint 3
    new THREE.Vector3(  800, 0, -1000),
    // Rechter bocht (voor & bij Checkpoint 4)
    new THREE.Vector3( 1400, 0,  -600),
    new THREE.Vector3( 1400, 0,     0), // Checkpoint 4
    new THREE.Vector3( 1400, 0,   600),
    // Terug naar Start/Finish
    new THREE.Vector3(  800, 0,  1000),
  ];
}

// ── Bouw het 3D baanmesh ──
function buildTrack(scene) {
  const points = buildTrackPoints();
  trackCurve = new THREE.CatmullRomCurve3(points, true, 'centripetal');

  const tubeSegments = 300;
  const w = TRACK.trackWidth;

  // Genereer baanvlak als lint
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
    uvs.push(0, t * 25, 1, t * 25);

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
  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#ffffff66';
  ctx.lineWidth = 4;
  ctx.setLineDash([16, 16]);
  ctx.beginPath(); ctx.moveTo(64, 0); ctx.lineTo(64, 128); ctx.stroke();
  const tex = new THREE.CanvasTexture(texCanvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;

  const mat = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide });
  trackMesh = new THREE.Mesh(geo, mat);
  scene.add(trackMesh);

  // ── Gras ondergrond ──
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(8000, 8000),
    new THREE.MeshLambertMaterial({ color: 0x388e3c })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  scene.add(ground);

  // ── Start/Finish lijn ──
  buildStartLine(scene);

  // ── Checkpoints 1 t/m 4 ──
  buildCheckpoints(scene);

  // ── Decor (oranje bomen en grijze stenen) ──
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
      ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#111111';
      ctx.fillRect(x * size, y * size, size, size);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(TRACK.trackWidth, 100),
    new THREE.MeshLambertMaterial({ map: tex })
  );
  mesh.rotation.x = -Math.PI / 2;

  // Lijn op start/finish punt (t = 0)
  const startPt = trackCurve.getPointAt(0);
  const startTan = trackCurve.getTangentAt(0);
  mesh.position.set(startPt.x, 0.02, startPt.z);
  mesh.rotation.z = Math.atan2(startTan.x, startTan.z);
  scene.add(mesh);
}

// ── Checkpoints 1 t/m 4 ──
// t-waarden verdeeld over de 4 secties van de ovaal (20%, 42%, 65%, 85%)
const CHECKPOINT_T = [0.20, 0.42, 0.65, 0.85];
const checkpointMeshes = [];
let checkpointState = { reached: [false, false, false, false], lap: 0 };

function buildCheckpoints(scene) {
  checkpointMeshes.length = 0;

  CHECKPOINT_T.forEach((t, i) => {
    const pt  = trackCurve.getPointAt(t);
    const tan = trackCurve.getTangentAt(t).normalize();
    const right = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

    // Visuele poort: twee rode pilaren met rode bovenbalk (Checkpoint 1 t/m 4)
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0xee2222 });
    const pillarGeo = new THREE.BoxGeometry(10, 50, 10);

    // Pilaren links en rechts van de baan
    [-1, 1].forEach(side => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      const edge = pt.clone().addScaledVector(right, side * (TRACK.trackWidth / 2 + 12));
      pillar.position.set(edge.x, 25, edge.z);
      scene.add(pillar);
    });

    // Bovenbalk over de baan
    const beamGeo = new THREE.BoxGeometry(TRACK.trackWidth + 30, 6, 6);
    const beam = new THREE.Mesh(beamGeo, pillarMat);
    beam.position.set(pt.x, 50, pt.z);
    beam.rotation.y = Math.atan2(tan.x, tan.z);
    scene.add(beam);

    // Opslaan triggervolume
    checkpointMeshes.push({ pos: pt.clone(), tan: tan.clone(), index: i });
  });
}

// Roep dit aan vanuit main.js elke frame met de kartpositie.
function updateCheckpoints(kartPos, kartHeading) {
  const state = checkpointState;
  const result = { lapComplete: false, lap: state.lap, checkpoints: [...state.reached] };

  // Check volgende actieve checkpoint
  const nextIndex = state.reached.indexOf(false);

  if (nextIndex !== -1) {
    const cp = checkpointMeshes[nextIndex];
    const dist = new THREE.Vector2(kartPos.x - cp.pos.x, kartPos.z - cp.pos.z).length();
    if (dist < TRACK.trackWidth * 0.85) {
      state.reached[nextIndex] = true;
      result.checkpoints = [...state.reached];
    }
  } else {
    // Alle 4 checkpoints gehaald — check Finish (t = 0)
    const finishPos = trackCurve.getPointAt(0);
    const distFinish = new THREE.Vector2(kartPos.x - finishPos.x, kartPos.z - finishPos.z).length();

    const finishTan = trackCurve.getTangentAt(0);
    const heading2D = new THREE.Vector2(Math.sin(kartHeading), Math.cos(kartHeading));
    const finishDir = new THREE.Vector2(finishTan.x, finishTan.z);
    const movingCorrectWay = heading2D.dot(finishDir) > 0;

    if (distFinish < TRACK.trackWidth * 0.85 && movingCorrectWay) {
      state.lap++;
      state.reached = [false, false, false, false];
      result.lap = state.lap;
      result.lapComplete = true;
      result.checkpoints = [false, false, false, false];
    }
  }

  return result;
}

function resetCheckpoints() {
  checkpointState = { reached: [false, false, false, false], lap: 0 };
}

// ── Decor: Oranje bomen en grijze stenen ──
function loadDecor(scene) {
  const loader = (typeof THREE !== 'undefined' && THREE.GLTFLoader) ? new THREE.GLTFLoader() : null;
  const decorData = generateDecorPositions();

  decorData.forEach(({ model, pos, scale, rot }) => {
    if (loader) {
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
        () => createFallbackDecor(scene, model, pos, rot)
      );
    } else {
      createFallbackDecor(scene, model, pos, rot);
    }
  });
}

// Fallback visualisaties: Oranje bomen (conisch) en Grijze stenen (dodecaëder)
function createFallbackDecor(scene, model, pos, rot) {
  let mesh;
  if (model === 'tree') {
    // Oranje boom
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 12, 30, 8),
      new THREE.MeshLambertMaterial({ color: 0x5c4033 })
    );
    trunk.position.y = 15;
    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(40, 90, 8),
      new THREE.MeshLambertMaterial({ color: 0xff6600 }) // Oranje bomen
    );
    leaves.position.y = 60;
    group.add(trunk, leaves);
    mesh = group;
  } else {
    // Grijze steen
    mesh = new THREE.Mesh(
      new THREE.DodecahedronGeometry(22, 1),
      new THREE.MeshLambertMaterial({ color: 0x888888 }) // Grijze stenen
    );
    mesh.position.y = 15;
  }

  mesh.position.set(pos.x, mesh.position.y || 0, pos.z);
  mesh.rotation.y = rot;
  scene.add(mesh);
  decorObjects.push(mesh);
}

function generateDecorPositions() {
  const decor = [];

  // Vaste posities binnen- en buitenveld volgens de nieuwe layout
  const setPositions = [
    // Binnenveld (stappen in de lus)
    { model: 'rock', pos: { x: -600, z: 200 } },
    { model: 'rock', pos: { x: -450, z: 250 } },
    { model: 'tree', pos: { x: -200, z: 300 } },
    { model: 'rock', pos: { x: 300, z: -200 } },
    { model: 'tree', pos: { x: 500, z: 100 } },

    // Buitenveld hoeken
    { model: 'rock', pos: { x: -1800, z: 1200 } },
    { model: 'rock', pos: { x: -1650, z: 1300 } },
    { model: 'tree', pos: { x: -1400, z: 1400 } },
    { model: 'tree', pos: { x: 1400, z: 1400 } },
    { model: 'rock', pos: { x: 1700, z: 1250 } },

    { model: 'rock', pos: { x: -1800, z: -1200 } },
    { model: 'tree', pos: { x: -1500, z: -1300 } },
    { model: 'tree', pos: { x: 1500, z: -1300 } },
    { model: 'rock', pos: { x: 1800, z: -1200 } },

    { model: 'tree', pos: { x: -1850, z: 0 } },
    { model: 'tree', pos: { x: 1850, z: 0 } },
  ];

  setPositions.forEach(item => {
    decor.push({
      model: item.model,
      pos: item.pos,
      scale: item.model === 'tree' ? 0.8 : 0.6,
      rot: Math.random() * Math.PI * 2
    });
  });

  // Dynamische random verspreiding langs de buitenranden
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const model = i % 2 === 0 ? 'tree' : 'rock';
    const radiusX = 2000 + Math.random() * 300;
    const radiusZ = 1400 + Math.random() * 300;

    decor.push({
      model,
      pos: {
        x: Math.cos(angle) * radiusX,
        z: Math.sin(angle) * radiusZ
      },
      scale: 0.7 + Math.random() * 0.4,
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
    document.addEventListener('keydown', () => trackAudio.play(), { once: true });
  });
}

function stopTrackMusic() {
  if (trackAudio) { trackAudio.pause(); trackAudio.currentTime = 0; }
}

// ── Exporteer voor main.js ──
function getTrackCurve()       { return trackCurve; }
function getTrackWidth()       { return TRACK.trackWidth; }
track.js
track.js weergeven.
