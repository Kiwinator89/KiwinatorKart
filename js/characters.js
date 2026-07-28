// characters.js — Rijders definitie

const CHARACTERS = {
  dartmonkey: {
    name: 'Dart Monkey',
    folder: 'Characters',
    sprites: {
      voor:   'DartMonkey_Voor.png',
      achter: 'DartMonkey_Achter.png',
      links:  'DartMonkey_Links.png',
      rechts: 'DartMonkey_Rechts.png',
    },
    speed:    9.6,   // +20% bij diagonaal (zie kart.js)
    handling: 7,
    weight:   5,
    special:  'diagonal_boost', // 20% sneller bij ~45 graden hoek
    desc:     'Razendsnel in bochten'
  },

  olifant: {
    name: 'Olifant',
    folder: 'Characters',
    sprites: {
      voor:   'Olifant_Voor.png',
      achter: 'Olifant_Achter.png',
      links:  'Olifant_Links.png',
      rechts: 'Olifant_Rechts.png',
    },
    speed:    7.2,   // 10% trager dan base 8
    handling: 10,
    weight:   9,
    special:  null,
    desc:     'Makkelijkst te besturen'
  },

  gijs: {
    name: 'Meester Gijs',
    folder: 'Characters',
    sprites: {
      voor:   'Gijs_Voor.png',
      achter: 'Gijs_Achter.png',
      links:  'Gijs_Links.png',
      rechts: 'Gijs_Rechts.png',
    },
    speed:    8,
    handling: 8,
    weight:   7,
    special:  null,
    desc:     'Solide in alle situaties'
  }
};

let selectedCharacter = 'gijs'; // standaard

// ── Vul karakter selectie grid in ──
function initCharSelect() {
  const grid = document.getElementById('char-grid');
  grid.innerHTML = '';

  Object.entries(CHARACTERS).forEach(([key, char]) => {
    const card = document.createElement('div');
    card.className = 'char-card' + (key === selectedCharacter ? ' selected' : '');
    card.onclick = () => selectChar(key);

    const spritePath = `${char.folder}/${char.sprites.voor}`;

    card.innerHTML = `
      <img src="${spritePath}" alt="${char.name}" onerror="this.style.opacity='0.3'">
      <div class="char-name">${char.name}</div>
      <div class="char-stat">⚡ ${char.speed} &nbsp; 🎯 ${char.handling}</div>
      <div class="char-stat" style="margin-top:0.2em;color:#aaa;font-size:0.7rem">${char.desc}</div>
    `;
    grid.appendChild(card);
  });
}

function selectChar(key) {
  selectedCharacter = key;
  document.querySelectorAll('.char-card').forEach((c, i) => {
    c.classList.toggle('selected', Object.keys(CHARACTERS)[i] === key);
  });
}

function getSelectedCharacter() {
  return { key: selectedCharacter, ...CHARACTERS[selectedCharacter] };
}
