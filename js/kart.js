// kart.js — Speler kart physics

// ── Constanten ──
const KART_CONFIG = {
  maxSpeed:        0.4,        // 10x langzamer (HUD schaalt nog naar 180 km/h)
  reverseSpeed:    0.2,
  acceleration:    0.018,      // proportioneel mee omlaag
  brakeForce:      0.035,
  friction:        0.96,
  driftFriction:   0.88,
  steerMax:        0.045,
  steerSpeed:      0.004,      // was 0.3 → stuurbug fix
  steerReturn:     0.007,
  gripBase:        1.0,
  gripMin:         0.55,
  downforce:       0.012,
  cornerBrake:     0.82,
  diagonalBoost:   1.20,
};

const CAM_CONFIG = {
  height:    6,
  distance:  14,
  lookAhead: 8,
  lerpPos:   0.08,
  lerpLook:  0.12,
};

// ── State ──
let kartMesh       = null;
let kartSprite     = null;
let kartBody       = {
  pos:        new THREE.Vector3(0, 0.6, 1800),
  vel:        new THREE.Vector3(),
  speed:      0,
  heading:    0,       // richting in radialen (Y-as)
  steer:      0,       // huidige stuurinput (-1 tot 1)
  steerAngle: 0,       // opgebouwde stuurhoek
  onGround:   true,
  drifting:   false,
};

let charConfig     = null;
let drivingAudio   = null;
let kartLoaded     = false;

const keys = { w: false, a: false, s: false, d: false, space: false };

// ── Camera state ──
const camPos      = new THREE.Vector3(0, 8, 1814);
const camTarget   = new THREE.Vector3(0, 0, 1800);

// ── Input ──
function initInput() {
  const map = { w:'w', a:'a', s:'s', d:'d', ' ':'space',
                arrowup:'w', arrowleft:'a', arrowdown:'s', arrowright:'d' };
  document.addEventListener('keydown', e => {
    const k = map[e.key.toLowerCase()];
    if (k) { keys[k] = true; e.preventDefault(); }
  });
  document.addEventListener('keyup', e => {
    const k = map[e.key.toLowerCase()];
    if (k) keys[k] = false;
  });
}

// ── Laad kart model + sprite ──
function initKart(scene, character, camera) {
  charConfig = character;

  // Rijgeluid
  drivingAudio = new Audio('Audio/Driving.mp3');
  drivingAudio.loop = true;
  drivingAudio.volume = 0;
  drivingAudio.play().catch(() => {
    document.addEventListener('keydown', () => drivingAudio.play(), { once: true });
  });

  // Laad Kart.glb
  const loader = new THREE.GLTFLoader();
  loader.load(
    'Models/Kart.glb',
    (gltf) => {
      kartMesh = gltf.scene;
      kartMesh.scale.setScalar(0.12);
      kartMesh.rotation.y = Math.PI / 2; // 90 graden draaien zodat model voorwaarts wijst
      kartMesh.position.copy(kartBody.pos);
      scene.add(kartMesh);

      // Karakter sprite bovenop kart
      buildCharSprite(scene, character);
      // Camera direct op juiste positie zetten zodat hij niet van ver hoeft te lerpen
      const b = kartBody;
      camPos.set(
        b.pos.x - Math.sin(b.heading) * CAM_CONFIG.distance,
        b.pos.y + CAM_CONFIG.height,
        b.pos.z - Math.cos(b.heading) * CAM_CONFIG.distance
      );
      camTarget.copy(b.pos);
      kartLoaded = true;
    },
    undefined,
    () => {
      // Fallback box kart
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.7, 3.2),
        new THREE.MeshLambertMaterial({ color: 0xff6b35 })
      );
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.3, 8),
        new THREE.MeshLambertMaterial({ color: 0x222222 })
      );
      kartMesh = new THREE.Group();
      kartMesh.add(body);
      [[-1.1,0,1.1],[1.1,0,1.1],[-1.1,0,-1.1],[1.1,0,-1.1]].forEach(([x,y,z]) => {
        const w = wheel.clone();
        w.position.set(x, y, z);
        w.rotation.z = Math.PI / 2;
        kartMesh.add(w);
      });
      kartMesh.position.copy(kartBody.pos);
      scene.add(kartMesh);
      buildCharSprite(scene, character);
      const b = kartBody;
      camPos.set(
        b.pos.x - Math.sin(b.heading) * CAM_CONFIG.distance,
        b.pos.y + CAM_CONFIG.height,
        b.pos.z - Math.cos(b.heading) * CAM_CONFIG.distance
      );
      camTarget.copy(b.pos);
      kartLoaded = true;
    }
  );

  initInput();
}

function buildCharSprite(scene, character) {
  const tex = new THREE.TextureLoader().load(
    `${character.folder}/${character.sprites.voor}`,
    undefined, undefined,
    () => {} // stil falen
  );
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  kartSprite = new THREE.Sprite(mat);
  kartSprite.scale.set(2.8, 2.8, 1);
  kartSprite.position.set(0, 2.4, 0);
  if (kartMesh) kartMesh.add(kartSprite);
}

// ── Sprite richting ──
function updateSprite(headingDeg) {
  if (!kartSprite || !charConfig) return;

  // 0=voor 90=rechts 180=achter 270=links (vanuit camera perspectief)
  const angle = ((headingDeg % 360) + 360) % 360;
  let key;
  if (angle < 45 || angle >= 315)      key = 'achter';
  else if (angle < 135)                key = 'links';
  else if (angle < 225)                key = 'voor';
  else                                 key = 'rechts';

  const src = `${charConfig.folder}/${charConfig.sprites[key]}`;
  if (kartSprite.material.map?.currentSrc?.includes(charConfig.sprites[key])) return;
  const tex = new THREE.TextureLoader().load(src);
  kartSprite.material.map = tex;
  kartSprite.material.needsUpdate = true;
}

// ── Physics update ──
function updateKart(delta) {
  if (!kartLoaded) return;

  const dt = Math.min(delta, 0.05);
  const b  = kartBody;

  // ── Stuurinput opbouwen ──
  let steerInput = 0;
  if (keys.a) steerInput = -1;
  if (keys.d) steerInput =  1;

  if (steerInput !== 0) {
    b.steerAngle += steerInput * KART_CONFIG.steerSpeed * (b.speed + 1);
  } else {
    b.steerAngle *= (1 - KART_CONFIG.steerReturn * (b.speed + 1));
  }
  b.steerAngle = THREE.MathUtils.clamp(
    b.steerAngle,
    -KART_CONFIG.steerMax,
    KART_CONFIG.steerMax
  );

  // ── Gas & rem ──
  const charSpeed = charConfig ? charConfig.speed / 8 : 1;
  const maxSpd    = KART_CONFIG.maxSpeed * charSpeed;

  if (keys.w) {
    b.speed += KART_CONFIG.acceleration * charSpeed;
    if (b.speed > maxSpd) b.speed = maxSpd;
  } else if (keys.s) {
    if (b.speed > 0.2) {
      b.speed -= KART_CONFIG.brakeForce;   // remmen
    } else {
      b.speed -= KART_CONFIG.acceleration * 0.5; // achteruit
      if (b.speed < -KART_CONFIG.reverseSpeed) b.speed = -KART_CONFIG.reverseSpeed;
    }
  } else {
    b.speed *= KART_CONFIG.friction;
    if (Math.abs(b.speed) < 0.05) b.speed = 0;
  }

  // ── Grip: minder grip = meer glijden in bocht ──
  const speedRatio = Math.abs(b.speed) / maxSpd;
  const grip = THREE.MathUtils.lerp(
    KART_CONFIG.gripBase,
    KART_CONFIG.gripMin,
    speedRatio - KART_CONFIG.downforce * speedRatio
  );

  // ── Stuur werkt minder effectief bij hoge snelheid zonder remmen ──
  const effectiveSteer = b.steerAngle * grip * Math.sign(b.speed || 1);
  b.heading += effectiveSteer * Math.abs(b.speed) * 0.08;

  // ── Corner brake: detecteer scherpe bocht ──
  const bendSharpness = Math.abs(b.steerAngle) / KART_CONFIG.steerMax;
  if (bendSharpness > 0.7 && Math.abs(b.speed) > maxSpd * 0.6) {
    b.speed *= KART_CONFIG.cornerBrake;
    b.drifting = true;
  } else {
    b.drifting = false;
  }

  // ── DartMonkey diagonale boost ──
  let speedMult = 1;
  if (charConfig?.special === 'diagonal_boost') {
    const relHeading = Math.abs(((b.heading * THREE.MathUtils.RAD2DEG) % 90 + 90) % 90 - 45);
    if (relHeading < 15) speedMult = KART_CONFIG.diagonalBoost;
  }

  // ── Positie updaten ──
  const dx = Math.sin(b.heading) * b.speed * speedMult * dt * 60;
  const dz = Math.cos(b.heading) * b.speed * speedMult * dt * 60;
  b.pos.x += dx;
  b.pos.z += dz;
  b.pos.y  = 0.6; // grond

  // ── Kart mesh updaten ──
  if (kartMesh) {
    kartMesh.position.copy(b.pos);
    kartMesh.rotation.y = b.heading + Math.PI / 2; // +90° offset om model voorwaarts te houden

    // Visuele kanteling in bochten
    kartMesh.rotation.z = THREE.MathUtils.lerp(
      kartMesh.rotation.z,
      -b.steerAngle * 8,
      0.15
    );
  }

  // ── Sprite richting ──
  const headingDeg = b.heading * THREE.MathUtils.RAD2DEG;
  updateSprite(headingDeg);

  // ── Motor geluid ──
  updateEngineAudio();

  return { speed: b.speed, maxSpeed: maxSpd, drifting: b.drifting };
}

// ── Camera volgt kart ──
function updateCamera(camera) {
  if (!kartLoaded) return;
  const b = kartBody;

  const behindX = b.pos.x - Math.sin(b.heading) * CAM_CONFIG.distance;
  const behindZ = b.pos.z - Math.cos(b.heading) * CAM_CONFIG.distance;

  const targetPos = new THREE.Vector3(
    behindX,
    b.pos.y + CAM_CONFIG.height,
    behindZ
  );

  camPos.lerp(targetPos, CAM_CONFIG.lerpPos);
  camera.position.copy(camPos);

  const lookAt = new THREE.Vector3(
    b.pos.x + Math.sin(b.heading) * CAM_CONFIG.lookAhead,
    b.pos.y + 1.5,
    b.pos.z + Math.cos(b.heading) * CAM_CONFIG.lookAhead
  );
  camTarget.lerp(lookAt, CAM_CONFIG.lerpLook);
  camera.lookAt(camTarget);
}

// ── Motor audio: pitch gebaseerd op snelheid ──
function updateEngineAudio() {
  if (!drivingAudio) return;
  const b = kartBody;
  const spd = Math.abs(b.speed);
  const maxSpd = KART_CONFIG.maxSpeed;

  const targetVol = spd > 0.3 ? THREE.MathUtils.lerp(0.2, 0.85, spd / maxSpd) : 0;
  drivingAudio.volume += (targetVol - drivingAudio.volume) * 0.05;

  // Eenvoudige pitch simulatie via playbackRate
  drivingAudio.playbackRate = THREE.MathUtils.lerp(0.7, 1.6, spd / maxSpd);
}

// ── Publieke getters voor main.js ──
function getKartPosition()  { return kartBody.pos.clone(); }
function getKartSpeed()     { return kartBody.speed; }
function getKartHeading()   { return kartBody.heading; }
function isKartDrifting()   { return kartBody.drifting; }
function getKartMaxSpeed()  { return KART_CONFIG.maxSpeed * (charConfig?.speed / 8 || 1); }
