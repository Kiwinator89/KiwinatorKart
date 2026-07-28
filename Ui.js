// ui.js — HUD, laptijden, eindscherm & audio notificaties
// Werkt samen met main.js, kart.js en track.js

// ── State ──
const UI = {
  lapTimes:        [],        // voltooide rondentijden (ms)
  currentLapStart: null,      // timestamp start huidige ronde
  raceStart:       null,      // timestamp start race
  raceFinished:    false,
  lapAudio:        null,
  finishAudio:     null,
  lastCheckpointT: -1,        // baanpositie (0-1) vorige frame voor lap detectie
  crossingCooldown:0,         // frames cooldown na finishlijn (voorkomt dubbeltelling)
  miniMapCanvas:   null,
  miniMapCtx:      null,
  kartDotAngle:    0,
};

// ── Init: bouw alle UI-elementen ──
function initUI() {
  buildHUDExtensions();
  buildMiniMap();
  buildLapNotification();
  buildEndScreen();
  preloadAudio();
}

// ── Bouw extra HUD-elementen bovenop index.html ──
function buildHUDExtensions() {
  const hud = document.getElementById('hud');

  // ── Timing blok (linksboven) ──
  const timingBlock = document.createElement('div');
  timingBlock.id = 'ui-timing';
  timingBlock.innerHTML = `
    <div class="ui-label">HUIDIGE RONDE</div>
    <div id="ui-cur-lap">0:00.000</div>
    <div class="ui-label" style="margin-top:0.5rem">BESTE RONDE</div>
    <div id="ui-best-lap">—</div>
    <div class="ui-label" style="margin-top:0.5rem">TOTALE TIJD</div>
    <div id="ui-total-time">0:00.000</div>
  `;
  hud.appendChild(timingBlock);

  // ── Rondetijden sidebar ──
  const lapList = document.createElement('div');
  lapList.id = 'ui-lap-list';
  lapList.innerHTML = '<div class="ui-label">RONDEN</div><div id="ui-lap-entries"></div>';
  hud.appendChild(lapList);

  // ── Drift indicator ──
  const driftBar = document.createElement('div');
  driftBar.id = 'ui-drift-wrap';
  driftBar.innerHTML = `
    <div class="ui-label">DRIFT</div>
    <div id="ui-drift-track"><div id="ui-drift-bar"></div></div>
  `;
  hud.appendChild(driftBar);

  // ── Grip meter ──
  const gripWrap = document.createElement('div');
  gripWrap.id = 'ui-grip-wrap';
  gripWrap.innerHTML = `
    <div class="ui-label">GRIP</div>
    <div id="ui-grip-track"><div id="ui-grip-bar"></div></div>
  `;
  hud.appendChild(gripWrap);

  // ── Stijlen injecteren ──
  const style = document.createElement('style');
  style.textContent = `
    /* ── Timing blok ── */
    #ui-timing {
      position: absolute;
      top: 1rem;
      left: 1.5rem;
      background: #000000bb;
      border: 1px solid #ffffff18;
      border-radius: 8px;
      padding: 0.8rem 1.1rem;
      min-width: 155px;
      pointer-events: none;
    }
    #ui-cur-lap {
      font-size: 1.35rem;
      font-weight: 900;
      color: #ffe94d;
      letter-spacing: 1px;
      font-variant-numeric: tabular-nums;
    }
    #ui-best-lap {
      font-size: 1rem;
      font-weight: 700;
      color: #a8e063;
      font-variant-numeric: tabular-nums;
    }
    #ui-total-time {
      font-size: 1rem;
      font-weight: 700;
      color: #ffffff99;
      font-variant-numeric: tabular-nums;
    }
    .ui-label {
      font-size: 0.58rem;
      letter-spacing: 2px;
      color: #ffffff44;
      text-transform: uppercase;
      margin-bottom: 0.15rem;
    }

    /* ── Rondetijden sidebar ── */
    #ui-lap-list {
      position: absolute;
      top: 50%;
      left: 1.5rem;
      transform: translateY(-50%);
      background: #000000bb;
      border: 1px solid #ffffff18;
      border-radius: 8px;
      padding: 0.8rem 1.1rem;
      min-width: 155px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s;
    }
    #ui-lap-list.visible { opacity: 1; }
    #ui-lap-entries {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      margin-top: 0.4rem;
    }
    .lap-entry {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      font-size: 0.88rem;
      font-variant-numeric: tabular-nums;
      color: #fff;
      padding: 0.25rem 0;
      border-bottom: 1px solid #ffffff10;
      animation: lapSlideIn 0.25s ease;
    }
    .lap-entry .lap-nr  { color: #ffffff55; font-size: 0.75rem; align-self: center; }
    .lap-entry .lap-tm  { font-weight: 700; color: #ffe94d; }
    .lap-entry .lap-tm.best { color: #a8e063; }
    .lap-entry .lap-tm.worst{ color: #ff6b35; }
    @keyframes lapSlideIn {
      from { opacity:0; transform: translateX(-8px); }
      to   { opacity:1; transform: translateX(0);    }
    }

    /* ── Drift & grip bars ── */
    #ui-drift-wrap, #ui-grip-wrap {
      position: absolute;
      right: 1.5rem;
      pointer-events: none;
    }
    #ui-drift-wrap { bottom: 8rem; }
    #ui-grip-wrap  { bottom: 6rem; }

    #ui-drift-track, #ui-grip-track {
      width: 120px;
      height: 5px;
      background: #ffffff18;
      border-radius: 3px;
      overflow: hidden;
      margin-top: 0.25rem;
    }
    #ui-drift-bar {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #ff6b35, #ff3864);
      border-radius: 3px;
      transition: width 0.1s, background 0.2s;
    }
    #ui-grip-bar {
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #ffe94d, #a8e063);
      border-radius: 3px;
      transition: width 0.15s, background 0.2s;
    }

    /* ── Minimap ── */
    #ui-minimap {
      position: absolute;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      background: #000000cc;
      border: 1px solid #ffffff22;
      border-radius: 8px;
      padding: 4px;
      pointer-events: none;
    }

    /* ── Lap notificatie ── */
    #ui-lap-notif {
      position: absolute;
      top: 38%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.8);
      background: #000000dd;
      border: 2px solid #ffe94d55;
      border-radius: 10px;
      padding: 1rem 2.5rem;
      text-align: center;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s, transform 0.25s;
    }
    #ui-lap-notif.show {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    #ui-lap-notif .notif-header {
      font-size: 0.65rem;
      letter-spacing: 3px;
      color: #ffffff55;
      text-transform: uppercase;
    }
    #ui-lap-notif .notif-round {
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
      margin: 0.15rem 0;
    }
    #ui-lap-notif .notif-time {
      font-size: 1.8rem;
      font-weight: 900;
      color: #ffe94d;
      letter-spacing: 2px;
      font-variant-numeric: tabular-nums;
    }
    #ui-lap-notif .notif-delta {
      font-size: 0.9rem;
      font-weight: 700;
      margin-top: 0.2rem;
    }
    #ui-lap-notif .notif-delta.better { color: #a8e063; }
    #ui-lap-notif .notif-delta.worse  { color: #ff6b35; }
    #ui-lap-notif .notif-delta.first  { color: #ffffff88; }

    /* ── Eindscherm ── */
    #ui-end-screen {
      position: fixed;
      inset: 0;
      background: #000000ee;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 30;
      animation: fadeInEnd 0.6s ease;
    }
    @keyframes fadeInEnd {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    #ui-end-screen.open { display: flex; }
    #ui-end-title {
      font-size: clamp(2rem, 6vw, 3.5rem);
      font-weight: 900;
      letter-spacing: -1px;
      background: linear-gradient(90deg, #ffe94d, #ff6b35);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.2em;
    }
    #ui-end-subtitle {
      font-size: 0.8rem;
      letter-spacing: 4px;
      color: #ffffff44;
      text-transform: uppercase;
      margin-bottom: 2.5rem;
    }
    #ui-end-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 2.5rem;
      width: min(680px, 90vw);
    }
    .end-stat-card {
      background: #ffffff08;
      border: 1px solid #ffffff15;
      border-radius: 10px;
      padding: 1.2rem 1rem;
      text-align: center;
    }
    .end-stat-card .esl { font-size: 0.6rem; letter-spacing: 2px; color: #ffffff44; text-transform: uppercase; margin-bottom: 0.4rem; }
    .end-stat-card .esv { font-size: 1.6rem; font-weight: 900; color: #ffe94d; font-variant-numeric: tabular-nums; }
    .end-stat-card .esv.green { color: #a8e063; }

    #ui-end-laps {
      width: min(500px, 90vw);
      background: #ffffff08;
      border: 1px solid #ffffff15;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 2.5rem;
    }
    .end-lap-row {
      display: grid;
      grid-template-columns: 40px 1fr 1fr 1fr;
      align-items: center;
      padding: 0.7rem 1.2rem;
      border-bottom: 1px solid #ffffff0a;
      font-size: 0.88rem;
      font-variant-numeric: tabular-nums;
      gap: 0.5rem;
    }
    .end-lap-row:last-child { border-bottom: none; }
    .end-lap-row.header {
      font-size: 0.6rem;
      letter-spacing: 2px;
      color: #ffffff44;
      text-transform: uppercase;
      background: #ffffff05;
    }
    .end-lap-row .best-mark { color: #a8e063; font-weight: 700; }
    .end-lap-row .worst-mark{ color: #ff6b35; }

    #ui-end-buttons { display: flex; gap: 1rem; }
    .end-btn {
      background: none;
      border: 2px solid #ffe94d44;
      color: #ffe94d;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 0.75em 2em;
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.15s, border-color 0.15s;
    }
    .end-btn:hover { background: #ffe94d18; border-color: #ffe94d; }
    .end-btn.primary {
      background: #ffe94d;
      color: #0a0a0f;
      border-color: #ffe94d;
    }
    .end-btn.primary:hover { background: #ffd700; }
  `;
  document.head.appendChild(style);
}

// ── Minimap ──
function buildMiniMap() {
  const wrap = document.createElement('div');
  wrap.id = 'ui-minimap';
  const canvas = document.createElement('canvas');
  canvas.width = 130; canvas.height = 100;
  wrap.appendChild(canvas);
  document.getElementById('hud').appendChild(wrap);
  UI.miniMapCanvas = canvas;
  UI.miniMapCtx    = canvas.getContext('2d');
}

function drawMiniMap(kartPos) {
  const ctx = UI.miniMapCtx;
  const W = UI.miniMapCanvas.width;
  const H = UI.miniMapCanvas.height;
  ctx.clearRect(0, 0, W, H);

  // Trek baan als lijn
  const curve = getTrackCurve ? getTrackCurve() : null;
  if (!curve) return;

  const pts = curve.getPoints(120);

  // Schaal baanpunten naar minimap
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  pts.forEach(p => {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
  });
  const padX = 10, padY = 8;
  const scaleX = (W - padX * 2) / (maxX - minX || 1);
  const scaleZ = (H - padY * 2) / (maxZ - minZ || 1);
  const sc = Math.min(scaleX, scaleZ);

  const toMM = p => ({
    x: padX + (p.x - minX) * sc,
    y: padY + (p.z - minZ) * sc,
  });

  ctx.strokeStyle = '#ffffff33';
  ctx.lineWidth   = 5;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  const first = toMM(pts[0]);
  ctx.moveTo(first.x, first.y);
  pts.forEach(p => { const m = toMM(p); ctx.lineTo(m.x, m.y); });
  ctx.closePath();
  ctx.stroke();

  // Finishlijn
  ctx.strokeStyle = '#ffffff88';
  ctx.lineWidth   = 2;
  const fp = toMM({ x: 0, z: 60 });
  ctx.beginPath();
  ctx.moveTo(fp.x - 5, fp.y);
  ctx.lineTo(fp.x + 5, fp.y);
  ctx.stroke();

  // Kart stip
  if (kartPos) {
    const kp = toMM({ x: kartPos.x, z: kartPos.z });
    ctx.fillStyle = '#ffe94d';
    ctx.beginPath();
    ctx.arc(kp.x, kp.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Kleine pijltje richting kart
    ctx.strokeStyle = '#ffe94dcc';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(kp.x, kp.y, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ── Lap notificatie ──
function buildLapNotification() {
  const el = document.createElement('div');
  el.id = 'ui-lap-notif';
  el.innerHTML = `
    <div class="notif-header">Ronde voltooid</div>
    <div class="notif-round" id="notif-round">Ronde 1</div>
    <div class="notif-time" id="notif-time">0:00.000</div>
    <div class="notif-delta" id="notif-delta"></div>
  `;
  document.getElementById('hud').appendChild(el);
}

let lapNotifTimer = null;
function showLapNotif(lapNumber, lapTimeMs, bestLapMs) {
  const el = document.getElementById('ui-lap-notif');
  document.getElementById('notif-round').textContent = `Ronde ${lapNumber}`;
  document.getElementById('notif-time').textContent  = formatTime(lapTimeMs);

  const delta = document.getElementById('notif-delta');
  if (UI.lapTimes.length <= 1) {
    delta.textContent   = 'Eerste ronde';
    delta.className     = 'notif-delta first';
  } else {
    const prev = UI.lapTimes[UI.lapTimes.length - 2];
    const diff = lapTimeMs - prev;
    if (diff < 0) {
      delta.textContent = `▲ ${formatTime(Math.abs(diff))} sneller`;
      delta.className   = 'notif-delta better';
    } else {
      delta.textContent = `▼ ${formatTime(diff)} langzamer`;
      delta.className   = 'notif-delta worse';
    }
    if (lapTimeMs === bestLapMs) {
      delta.textContent = '⭐ Beste ronde!';
      delta.className   = 'notif-delta better';
    }
  }

  el.classList.add('show');
  if (lapNotifTimer) clearTimeout(lapNotifTimer);
  lapNotifTimer = setTimeout(() => el.classList.remove('show'), 3500);

  // Audio
  playLapSound();
}

// ── Eindscherm ──
function buildEndScreen() {
  const el = document.createElement('div');
  el.id = 'ui-end-screen';
  el.innerHTML = `
    <div id="ui-end-title">FINISH!</div>
    <div id="ui-end-subtitle">Race afgelopen</div>
    <div id="ui-end-stats">
      <div class="end-stat-card">
        <div class="esl">Totale tijd</div>
        <div class="esv" id="es-total">—</div>
      </div>
      <div class="end-stat-card">
        <div class="esl">Beste ronde</div>
        <div class="esv green" id="es-best">—</div>
      </div>
      <div class="end-stat-card">
        <div class="esl">Gem. rondetijd</div>
        <div class="esv" id="es-avg">—</div>
      </div>
    </div>
    <div id="ui-end-laps">
      <div class="end-lap-row header">
        <span>#</span><span>Tijd</span><span>Verschil</span><span></span>
      </div>
      <div id="es-lap-rows"></div>
    </div>
    <div id="ui-end-buttons">
      <button class="end-btn primary" onclick="restartRace()">Opnieuw rijden</button>
      <button class="end-btn" onclick="backToMenu()">Hoofdmenu</button>
    </div>
  `;
  document.body.appendChild(el);
}

function showEndScreen() {
  const times  = UI.lapTimes;
  const total  = times.reduce((a, b) => a + b, 0);
  const best   = Math.min(...times);
  const avg    = total / times.length;

  document.getElementById('es-total').textContent = formatTime(total);
  document.getElementById('es-best').textContent  = formatTime(best);
  document.getElementById('es-avg').textContent   = formatTime(avg);

  const rowsEl = document.getElementById('es-lap-rows');
  rowsEl.innerHTML = '';
  times.forEach((t, i) => {
    const isBest  = t === best;
    const isWorst = t === Math.max(...times);
    const diff    = i === 0 ? 0 : t - times[i - 1];
    const diffTxt = i === 0 ? '—' : (diff > 0 ? `+${formatTime(diff)}` : `-${formatTime(Math.abs(diff))}`);
    const diffCls = diff < 0 ? 'best-mark' : diff > 0 ? 'worst-mark' : '';

    rowsEl.innerHTML += `
      <div class="end-lap-row">
        <span style="color:#ffffff55">${i + 1}</span>
        <span style="font-weight:700;color:${isBest ? '#a8e063' : '#fff'}">${formatTime(t)}</span>
        <span class="${diffCls}">${diffTxt}</span>
        <span style="font-size:0.75rem">${isBest ? '⭐ Beste' : isWorst ? '🐢 Traagste' : ''}</span>
      </div>
    `;
  });

  document.getElementById('ui-end-screen').classList.add('open');
  playFinishSound();
}

// ── Audio ──
function preloadAudio() {
  UI.lapAudio    = new Audio('Audio/Lap.mp3');
  UI.lapAudio.volume = 0.75;
  UI.finishAudio = new Audio('Audio/Finish.mp3');
  UI.finishAudio.volume = 0.9;
}

function playLapSound() {
  if (!UI.lapAudio) return;
  UI.lapAudio.currentTime = 0;
  UI.lapAudio.play().catch(() => {});
}

function playFinishSound() {
  if (!UI.finishAudio) return;
  UI.finishAudio.currentTime = 0;
  UI.finishAudio.play().catch(() => {});
  // Muziek zachter bij finish
  if (typeof stopTrackMusic === 'function') stopTrackMusic();
}

// ── Hulpfuncties ──
function formatTime(ms) {
  if (ms == null || isNaN(ms)) return '—';
  const m   = Math.floor(ms / 60000);
  const s   = Math.floor((ms % 60000) / 1000);
  const mil = Math.floor(ms % 1000);
  return `${m}:${String(s).padStart(2,'0')}.${String(mil).padStart(3,'0')}`;
}

function getBestLap() {
  if (!UI.lapTimes.length) return Infinity;
  return Math.min(...UI.lapTimes);
}

// ── Rondedetectie via finishlijn ──
// Aanroepen vanuit main.js gameLoop, geeft true terug als race klaar is
function checkLapCrossing(kartPos, heading) {
  if (UI.raceFinished) return true;

  // Finishlijn: Z ≈ 60, X tussen -6 en +6
  const atFinish = Math.abs(kartPos.z - 60) < 2.5 && Math.abs(kartPos.x) < 7;

  // Rijdt de kart "vooruit" over de finish (negatieve Z richting = voorbij de lijn)
  const movingForward = Math.cos(heading) > 0.1;

  if (UI.crossingCooldown > 0) {
    UI.crossingCooldown--;
    return false;
  }

  if (atFinish && movingForward) {
    const now = performance.now();

    if (UI.currentLapStart === null) {
      // Eerste crossing: start race
      UI.currentLapStart = now;
      UI.raceStart       = now;
      return false;
    }

    // Voltooide ronde
    const lapTime = now - UI.currentLapStart;
    UI.lapTimes.push(lapTime);
    UI.currentLapStart = now;
    UI.crossingCooldown = 80; // ~1.3s bij 60fps

    const lapNumber = UI.lapTimes.length;
    showLapNotif(lapNumber, lapTime, getBestLap());
    addLapToSidebar(lapNumber, lapTime);

    // Laatste ronde?
    const totalLaps = (typeof TOTAL_LAPS !== 'undefined') ? TOTAL_LAPS : 3;
    if (lapNumber >= totalLaps) {
      UI.raceFinished = true;
      setTimeout(showEndScreen, 1800);
      return true;
    }

    // Ronde HUD update
    if (typeof lapCount !== 'undefined') {
      lapCount = lapNumber;
      if (typeof updateHUDLap === 'function') updateHUDLap();
    }
  }

  return false;
}

function addLapToSidebar(lapNumber, lapTimeMs) {
  const entries = document.getElementById('ui-lap-entries');
  const isBest  = lapTimeMs === getBestLap();

  const row = document.createElement('div');
  row.className = 'lap-entry';
  row.innerHTML = `
    <span class="lap-nr">R${lapNumber}</span>
    <span class="lap-tm ${isBest ? 'best' : ''}">${formatTime(lapTimeMs)}</span>
  `;
  entries.appendChild(row);

  const list = document.getElementById('ui-lap-list');
  list.classList.add('visible');
}

// ── Hoofd update: aanroepen elke frame vanuit main.js ──
function updateUI(kartState, kartPos, heading) {
  if (!kartState) return false;
  if (UI.raceFinished) return true;

  const now = performance.now();

  // Huidige rondeklok
  if (UI.currentLapStart !== null) {
    const curLapMs = now - UI.currentLapStart;
    document.getElementById('ui-cur-lap').textContent = formatTime(curLapMs);
    document.getElementById('ui-total-time').textContent =
      formatTime(now - UI.raceStart);
  }

  // Beste ronde
  if (UI.lapTimes.length) {
    document.getElementById('ui-best-lap').textContent = formatTime(getBestLap());
  }

  // Drift indicator
  const driftPct = kartState.drifting ? 100 : 0;
  const driftBar = document.getElementById('ui-drift-bar');
  const curDrift = parseFloat(driftBar.style.width) || 0;
  driftBar.style.width = (curDrift + (driftPct - curDrift) * 0.25) + '%';

  // Grip meter
  const speedRatio = Math.abs(kartState.speed) / kartState.maxSpeed;
  const gripPct    = Math.max(30, 100 - speedRatio * 55 + (kartState.drifting ? -20 : 0));
  const gripBar    = document.getElementById('ui-grip-bar');
  const curGrip    = parseFloat(gripBar.style.width) || 100;
  gripBar.style.width = (curGrip + (gripPct - curGrip) * 0.15) + '%';
  gripBar.style.background = gripPct > 60
    ? 'linear-gradient(90deg,#ffe94d,#a8e063)'
    : gripPct > 35
      ? 'linear-gradient(90deg,#ff6b35,#ffe94d)'
      : 'linear-gradient(90deg,#ff3864,#ff6b35)';

  // Minimap
  drawMiniMap(kartPos);

  // Ronderdetectie
  return checkLapCrossing(kartPos, heading);
}

// ── Knoppen ──
function restartRace() {
  document.getElementById('ui-end-screen').classList.remove('open');
  document.getElementById('hud').style.display = 'none';

  // Reset UI state
  UI.lapTimes        = [];
  UI.currentLapStart = null;
  UI.raceStart       = null;
  UI.raceFinished    = false;
  UI.crossingCooldown= 0;
  document.getElementById('ui-cur-lap').textContent   = '0:00.000';
  document.getElementById('ui-best-lap').textContent  = '—';
  document.getElementById('ui-total-time').textContent= '0:00.000';
  document.getElementById('ui-lap-entries').innerHTML = '';
  document.getElementById('ui-lap-list').classList.remove('visible');
  document.getElementById('ui-lap-notif').classList.remove('show');

  if (typeof startRace === 'function') startRace();
}

function backToMenu() {
  document.getElementById('ui-end-screen').classList.remove('open');
  document.getElementById('hud').style.display = 'none';

  // Reset UI state
  UI.lapTimes        = [];
  UI.currentLapStart = null;
  UI.raceStart       = null;
  UI.raceFinished    = false;
  UI.crossingCooldown= 0;

  if (typeof showMenu === 'function') showMenu();
  if (typeof stopTrackMusic === 'function') stopTrackMusic();
}
