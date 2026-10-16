/**
 * ASCII.VIBES - Animated ASCII Engine
 * Featuring: BB Demoscene (AAlib tribute), Fire, 3D Twister, Donut, Cube, Matrix, Tunnel & Wave
 */

const display = document.getElementById('ascii-display');
const fpsDisplay = document.getElementById('fps-display');
const speedSlider = document.getElementById('speed-slider');
const speedVal = document.getElementById('speed-val');
const themeSelect = document.getElementById('theme-select');
const btnToggleCrt = document.getElementById('btn-toggle-crt');
const btnPause = document.getElementById('btn-pause');
const btnFullscreen = document.getElementById('btn-fullscreen');
const btnAudio = document.getElementById('btn-audio');
const sceneButtons = document.querySelectorAll('.btn-group .btn');

let currentScene = 'bb';
let isPaused = false;
let speedMultiplier = 1.0;
let time = 0;
let lastFrameTime = performance.now();
let frameCount = 0;
let fpsTimer = 0;

// Dimensions of ASCII display buffer
let cols = 80;
let rows = 40;

function calculateGridSize() {
  const width = window.innerWidth;
  const height = window.innerHeight - 150; // account for header and footer

  const charWidth = width < 768 ? 6 : 9;
  const charHeight = width < 768 ? 10 : 15;

  cols = Math.min(110, Math.max(50, Math.floor(width / charWidth)));
  rows = Math.min(48, Math.max(26, Math.floor(height / charHeight)));

  if (display) {
    display.style.fontSize = width < 768 ? '10px' : '14px';
    display.style.lineHeight = width < 768 ? '9px' : '12px';
  }
}

calculateGridSize();
window.addEventListener('resize', () => {
  calculateGridSize();
  if (currentScene === 'matrix') initMatrix();
  initFire();
});

// ==========================================
// DEMOSCENE CHIPTUNE AUDIO ENGINE (Web Audio)
// ==========================================
let audioCtx = null;
let isAudioPlaying = false;
let audioTimer = null;
let currentStep = 0;

// Classic 90s tracker demoscene chord progression (Am, F, C, G)
const bassNotes = [
  110, 110, 220, 110,  110, 110, 164.81, 110, // A2 / E3
  87.31, 87.31, 174.61, 87.31,  87.31, 87.31, 130.81, 87.31, // F2 / C3
  130.81, 130.81, 261.63, 130.81,  130.81, 130.81, 196.00, 130.81, // C3 / G3
  98.00, 98.00, 196.00, 98.00,  98.00, 98.00, 146.83, 98.00, // G2 / D3
];

const leadMelody = [
  440, 0, 523.25, 659.25,  587.33, 0, 523.25, 440,
  349.23, 0, 440, 523.25,  659.25, 587.33, 523.25, 392,
  523.25, 0, 659.25, 783.99,  659.25, 0, 587.33, 523.25,
  392, 0, 493.88, 587.33,  659.25, 587.33, 493.88, 392
];

function playChiptuneStep() {
  if (!isAudioPlaying || !audioCtx) return;

  const now = audioCtx.currentTime;
  const bassFreq = bassNotes[currentStep % bassNotes.length];
  const leadFreq = leadMelody[currentStep % leadMelody.length];

  // 1. Bass Arpeggio Synth (Square wave)
  if (bassFreq > 0) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(bassFreq, now);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  // 2. Lead Synth (Sawtooth wave with subtle glide)
  if (leadFreq > 0) {
    const oscLead = audioCtx.createOscillator();
    const gainLead = audioCtx.createGain();
    oscLead.type = 'sawtooth';
    oscLead.frequency.setValueAtTime(leadFreq, now);

    gainLead.gain.setValueAtTime(0.04, now);
    gainLead.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    oscLead.connect(gainLead);
    gainLead.connect(audioCtx.destination);
    oscLead.start(now);
    oscLead.stop(now + 0.23);
  }

  // 3. Hi-hat / White Noise percussive tick
  if (currentStep % 2 === 0) {
    const bufferSize = audioCtx.sampleRate * 0.03;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(currentStep % 4 === 2 ? 0.03 : 0.015, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    whiteNoise.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    whiteNoise.start(now);
  }

  currentStep++;
}

function toggleAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (isAudioPlaying) {
    isAudioPlaying = false;
    clearInterval(audioTimer);
    btnAudio.textContent = '🔊 SOUND: OFF';
    btnAudio.classList.remove('active');
  } else {
    audioCtx.resume();
    isAudioPlaying = true;
    currentStep = 0;
    audioTimer = setInterval(playChiptuneStep, 130);
    btnAudio.textContent = '🔊 SOUND: ON';
    btnAudio.classList.add('active');
  }
}

btnAudio.addEventListener('click', toggleAudio);

// ==========================================
// SCENE 1: THE LEGENDARY "BB" DEMOSCENE SHOW
// ==========================================
// AA-Project BB ASCII Logo
const bbLogoLines = [
  " ██████╗  ██████╗ ",
  " ██╔══██╗ ██╔══██╗",
  " ██████╔╝ ██████╔╝",
  " ██╔══██╗ ██╔══██╗",
  " ██████╔╝ ██████╔╝",
  " ╚═════╝  ╚═════╝ "
];

const bbScrollerText = " *** AA-PROJECT PRESENTS: BB - THE PORTABLE ASCII-ART DEMO *** REBORN ON THE MODERN WEB *** GREETINGS TO ALL DEMO CODERS AROUND THE GLOBE: TRSI * RAZOR 1911 * FAIRLIGHT * FUTURE CREW * FARBRAUSCH * REBELS * COMA * THE BLACK LOTUS * SCENERS EVERYWHERE! *** ENJOY THE VIBES *** ";
let scrollerPos = 0;
let bbTimer = 0;

function renderBB(dt) {
  bbTimer += dt * speedMultiplier;
  scrollerPos += 0.35 * speedMultiplier;

  // The BB demo alternates between 3 classic sequences:
  // 0 - 10s: Grand Title Card + Starfield + Sine Scroller
  // 10 - 20s: Burning Fire with superimposed BB
  // 20 - 30s: 3D Twister with greetings
  const cycle = Math.floor(bbTimer) % 30;

  if (cycle < 10) {
    return renderBBTitle(dt);
  } else if (cycle < 20) {
    return renderBBFireWithLogo(dt);
  } else {
    return renderBBTwisterScene(dt);
  }
}

// 1A. BB Title Scene with Starfield & Bouncing Sine Banner
let stars = [];
function initStars() {
  stars = [];
  for (let i = 0; i < 90; i++) {
    stars.push({
      x: (Math.random() - 0.5) * cols,
      y: (Math.random() - 0.5) * rows,
      z: Math.random() * 30 + 1
    });
  }
}
initStars();

function renderBBTitle(dt) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(' '));

  // Update & Draw 3D Stars
  for (let s of stars) {
    s.z -= 0.6 * speedMultiplier;
    if (s.z <= 0.5) {
      s.x = (Math.random() - 0.5) * cols;
      s.y = (Math.random() - 0.5) * rows;
      s.z = 30;
    }
    const k = 14 / s.z;
    const px = Math.floor(cols / 2 + s.x * k);
    const py = Math.floor(rows / 2 + s.y * k);

    if (px >= 0 && px < cols && py >= 0 && py < rows) {
      grid[py][px] = s.z < 8 ? '*' : (s.z < 18 ? '+' : '.');
    }
  }

  // Draw Pulsing / Floating BB ASCII Logo
  const bounceY = Math.floor(Math.sin(bbTimer * 2.5) * 3);
  const logoStartY = Math.floor(rows / 2 - bbLogoLines.length / 2) + bounceY - 3;
  const logoStartX = Math.floor(cols / 2 - bbLogoLines[0].length / 2);

  for (let l = 0; l < bbLogoLines.length; l++) {
    const y = logoStartY + l;
    if (y >= 0 && y < rows) {
      const line = bbLogoLines[l];
      for (let c = 0; c < line.length; c++) {
        const x = logoStartX + c;
        if (x >= 0 && x < cols && line[c] !== ' ') {
          grid[y][x] = line[c];
        }
      }
    }
  }

  // Subtitle banner
  const sub = "[ BB - THE PORTABLE ASCII-ART DEMO ]";
  const subY = logoStartY + bbLogoLines.length + 1;
  const subX = Math.floor(cols / 2 - sub.length / 2);
  for (let c = 0; c < sub.length; c++) {
    if (subY >= 0 && subY < rows && subX + c >= 0 && subX + c < cols) {
      grid[subY][subX + c] = sub[c];
    }
  }

  // Sine Wave Scroller at bottom
  const scrollOffset = Math.floor(scrollerPos);
  const scrollerRow = rows - 4;
  for (let x = 0; x < cols; x++) {
    const charIdx = (scrollOffset + x) % bbScrollerText.length;
    const sineY = scrollerRow + Math.floor(Math.sin((x * 0.15) + (bbTimer * 4)) * 1.8);
    if (sineY >= 0 && sineY < rows) {
      grid[sineY][x] = bbScrollerText[charIdx];
    }
  }

  return grid.map(r => r.join('')).join('\n');
}

// ==========================================
// SCENE 2: CLASSIC DEMOSCENE FIRE (BB FIRE)
// ==========================================
let fireBuffer = [];
const fireChars = '  ..::--==++**##%%@@██';

function initFire() {
  fireBuffer = Array.from({ length: rows + 2 }, () => Array(cols).fill(0));
}
initFire();

function updateFire() {
  // Ignite bottom rows with random high heat
  const bottomRow1 = rows;
  const bottomRow2 = rows + 1;

  for (let x = 0; x < cols; x++) {
    fireBuffer[bottomRow1][x] = Math.random() > 0.18 ? 255 : 0;
    fireBuffer[bottomRow2][x] = Math.random() > 0.10 ? 255 : 0;
  }

  // Propagate heat upwards (average + cooling factor)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const xLeft = (x - 1 + cols) % cols;
      const xRight = (x + 1) % cols;

      const below1 = fireBuffer[y + 1][x];
      const belowLeft = fireBuffer[y + 1][xLeft];
      const belowRight = fireBuffer[y + 1][xRight];
      const below2 = fireBuffer[y + 2][x];

      const decay = Math.floor(Math.random() * 3.8) + 1.2;
      const avg = Math.floor((below1 + belowLeft + belowRight + below2) / 4.02) - decay;
      fireBuffer[y][x] = Math.max(0, avg);
    }
  }
}

function renderBBFire(dt) {
  updateFire();
  const grid = Array.from({ length: rows }, () => Array(cols).fill(' '));

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const heat = fireBuffer[y][x];
      const charIdx = Math.floor((heat / 255) * (fireChars.length - 1));
      grid[y][x] = fireChars[Math.max(0, Math.min(fireChars.length - 1, charIdx))];
    }
  }

  return grid.map(r => r.join('')).join('\n');
}

function renderBBFireWithLogo(dt) {
  updateFire();
  const grid = Array.from({ length: rows }, () => Array(cols).fill(' '));

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const heat = fireBuffer[y][x];
      const charIdx = Math.floor((heat / 255) * (fireChars.length - 1));
      grid[y][x] = fireChars[Math.max(0, Math.min(fireChars.length - 1, charIdx))];
    }
  }

  // Superimpose burning BB text
  const logoStartY = Math.floor(rows / 2 - bbLogoLines.length / 2) - 2;
  const logoStartX = Math.floor(cols / 2 - bbLogoLines[0].length / 2);

  for (let l = 0; l < bbLogoLines.length; l++) {
    const y = logoStartY + l;
    if (y >= 0 && y < rows) {
      const line = bbLogoLines[l];
      for (let c = 0; c < line.length; c++) {
        const x = logoStartX + c;
        if (x >= 0 && x < cols && line[c] !== ' ') {
          grid[y][x] = line[c];
        }
      }
    }
  }

  // Bottom caption
  const caption = "== [ BB FLAME GENERATOR ] ==";
  const capX = Math.floor(cols / 2 - caption.length / 2);
  for (let i = 0; i < caption.length; i++) {
    if (capX + i >= 0 && capX + i < cols) {
      grid[rows - 2][capX + i] = caption[i];
    }
  }

  return grid.map(r => r.join('')).join('\n');
}

// ==========================================
// SCENE 3: 3D DEMOSCENE TWISTER (BB TWISTER)
// ==========================================
let twisterAngle = 0;

function renderBBTwister(dt) {
  twisterAngle += 0.05 * speedMultiplier;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(' '));
  const centerX = Math.floor(cols / 2);
  const width = Math.min(cols * 0.28, 22);

  const faceChars = ['#', '=', ':', '.'];

  for (let y = 0; y < rows; y++) {
    // Twist angle depends on Y height + time
    const a = twisterAngle + (y * 0.12);

    // 4 corners of square cross section
    const pts = [
      Math.sin(a) * width,
      Math.sin(a + Math.PI * 0.5) * width,
      Math.sin(a + Math.PI) * width,
      Math.sin(a + Math.PI * 1.5) * width,
    ];

    // Draw visible front-facing sides
    for (let f = 0; f < 4; f++) {
      const x1 = pts[f];
      const x2 = pts[(f + 1) % 4];

      if (x1 < x2) { // Face is facing forward
        const startX = Math.floor(centerX + x1);
        const endX = Math.floor(centerX + x2);
        const char = faceChars[f];

        for (let x = startX; x <= endX; x++) {
          if (x >= 0 && x < cols) {
            grid[y][x] = char;
          }
        }
        // Border edges
        if (startX >= 0 && startX < cols) grid[y][startX] = '|';
        if (endX >= 0 && endX < cols) grid[y][endX] = '|';
      }
    }
  }

  return grid.map(r => r.join('')).join('\n');
}

function renderBBTwisterScene(dt) {
  const frame = renderBBTwister(dt).split('\n').map(l => l.split(''));

  // Add side scroller greetings
  const msg1 = ">>> BB DEMOSCENE 3D TWISTER <<<";
  const startX1 = Math.floor(cols / 2 - msg1.length / 2);
  for (let i = 0; i < msg1.length; i++) {
    if (startX1 + i >= 0 && startX1 + i < cols) {
      frame[2][startX1 + i] = msg1[i];
    }
  }

  const scrollOffset = Math.floor(scrollerPos);
  for (let x = 0; x < cols; x++) {
    const charIdx = (scrollOffset + x) % bbScrollerText.length;
    frame[rows - 3][x] = bbScrollerText[charIdx];
  }

  return frame.map(r => r.join('')).join('\n');
}

// ==========================================
// SCENE 4: 3D TORUS (THE DONUT)
// ==========================================
let A = 0;
let B = 0;

function renderDonut(dt) {
  A += 0.04 * speedMultiplier;
  B += 0.02 * speedMultiplier;

  const b = [];
  const z = [];
  const bufferSize = cols * rows;

  for (let k = 0; k < bufferSize; k++) {
    b[k] = ' ';
    z[k] = 0;
  }

  const cosA = Math.cos(A), sinA = Math.sin(A);
  const cosB = Math.cos(B), sinB = Math.sin(B);

  for (let j = 0; j < 6.28; j += 0.07) {
    const cosj = Math.cos(j), sinj = Math.sin(j);

    for (let i = 0; i < 6.28; i += 0.02) {
      const sini = Math.sin(i), cosi = Math.cos(i);

      const h = cosj + 2;
      const D = 1 / (sini * h * sinA + sinj * cosA + 5);
      const t = sini * h * cosA - sinj * sinA;

      const x = Math.floor(cols / 2 + (cols * 0.42) * D * (cosi * h * cosB - t * sinB));
      const y = Math.floor(rows / 2 + (rows * 0.42) * D * (cosi * h * sinB + t * cosB));
      const o = x + cols * y;

      const N = Math.floor(8 * ((sinj * sinA - sini * cosj * cosA) * cosB - sini * cosj * sinA - sinj * cosA - cosi * cosj * sinB));

      if (y >= 0 && y < rows && x >= 0 && x < cols && D > z[o]) {
        z[o] = D;
        b[o] = '.,-~:;=!*#$@'[N > 0 ? N : 0];
      }
    }
  }

  let output = '';
  for (let r = 0; r < rows; r++) {
    output += b.slice(r * cols, (r + 1) * cols).join('') + '\n';
  }
  return output;
}

// ==========================================
// SCENE 5: 3D ROTATING WIREFRAME CUBE
// ==========================================
let cubeRotX = 0;
let cubeRotY = 0;
let cubeRotZ = 0;

function renderCube(dt) {
  cubeRotX += 0.025 * speedMultiplier;
  cubeRotY += 0.035 * speedMultiplier;
  cubeRotZ += 0.015 * speedMultiplier;

  const grid = Array.from({ length: rows }, () => Array(cols).fill(' '));
  const zBuffer = Array.from({ length: rows }, () => Array(cols).fill(-9999));

  const size = 1.6;
  const vertices = [
    [-size, -size, -size],
    [size, -size, -size],
    [size, size, -size],
    [-size, size, -size],
    [-size, -size, size],
    [size, -size, size],
    [size, size, size],
    [-size, size, size],
  ];

  function rotate([x, y, z]) {
    let y1 = y * Math.cos(cubeRotX) - z * Math.sin(cubeRotX);
    let z1 = y * Math.sin(cubeRotX) + z * Math.cos(cubeRotX);
    let x1 = x;
    let x2 = x1 * Math.cos(cubeRotY) + z1 * Math.sin(cubeRotY);
    let z2 = -x1 * Math.sin(cubeRotY) + z1 * Math.cos(cubeRotY);
    let y2 = y1;
    let x3 = x2 * Math.cos(cubeRotZ) - y2 * Math.sin(cubeRotZ);
    let y3 = x2 * Math.sin(cubeRotZ) + y2 * Math.cos(cubeRotZ);
    let z3 = z2;
    return [x3, y3, z3];
  }

  function drawLine(p1, p2, char) {
    const steps = 30;
    for (let s = 0; s <= steps; s++) {
      const f = s / steps;
      const pt = [
        p1[0] + (p2[0] - p1[0]) * f,
        p1[1] + (p2[1] - p1[1]) * f,
        p1[2] + (p2[2] - p1[2]) * f,
      ];
      const distance = 4.2;
      const ooz = 1 / (distance + pt[2]);
      const xp = Math.floor(cols / 2 + pt[0] * ooz * cols * 0.8);
      const yp = Math.floor(rows / 2 + pt[1] * ooz * rows * 0.9);

      if (xp >= 0 && xp < cols && yp >= 0 && yp < rows) {
        if (pt[2] > zBuffer[yp][xp]) {
          zBuffer[yp][xp] = pt[2];
          grid[yp][xp] = char;
        }
      }
    }
  }

  const rotVertices = vertices.map(rotate);
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];

  const chars = ['#', '*', '+', '=', '@', '%'];
  edges.forEach(([i, j], idx) => {
    drawLine(rotVertices[i], rotVertices[j], chars[idx % chars.length]);
  });

  return grid.map(row => row.join('')).join('\n');
}

// ==========================================
// SCENE 6: MATRIX DIGITAL RAIN
// ==========================================
const matrixChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ';
let matrixDrops = [];

function initMatrix() {
  matrixDrops = [];
  for (let c = 0; c < cols; c++) {
    matrixDrops[c] = {
      y: Math.random() * -rows,
      speed: 0.3 + Math.random() * 0.7,
      length: Math.floor(6 + Math.random() * 16),
      chars: []
    };
  }
}
initMatrix();

function renderMatrix(dt) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(' '));

  for (let c = 0; c < cols; c += 2) {
    const drop = matrixDrops[c];
    if (!drop) continue;

    drop.y += drop.speed * speedMultiplier;

    if (drop.y - drop.length > rows) {
      drop.y = 0;
      drop.speed = 0.3 + Math.random() * 0.7;
      drop.length = Math.floor(6 + Math.random() * 16);
    }

    const headY = Math.floor(drop.y);
    for (let l = 0; l < drop.length; l++) {
      const y = headY - l;
      if (y >= 0 && y < rows) {
        if (l === 0) {
          grid[y][c] = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        } else if (l < drop.length - 1) {
          if (!drop.chars[l] || Math.random() < 0.05) {
            drop.chars[l] = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          }
          grid[y][c] = drop.chars[l];
        } else {
          grid[y][c] = '.';
        }
      }
    }
  }

  return grid.map(row => row.join('')).join('\n');
}

// ==========================================
// SCENE 7: WARP TUNNEL
// ==========================================
function renderTunnel(dt) {
  time += 0.05 * speedMultiplier;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(' '));
  const cx = cols / 2;
  const cy = rows / 2;
  const densityChars = ' .:-=+*#%@';

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const dx = (x - cx) * 1.8;
      const dy = (y - cy);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1) continue;

      const angle = Math.atan2(dy, dx);
      const depth = (35 / dist) + time * 1.5;
      const spiral = angle / Math.PI * 3 + depth;

      const val = (Math.sin(depth * 3) + Math.cos(spiral * 4) + 2) / 4;
      const charIdx = Math.floor(val * (densityChars.length - 1));

      grid[y][x] = densityChars[Math.max(0, Math.min(densityChars.length - 1, charIdx))];
    }
  }

  return grid.map(row => row.join('')).join('\n');
}

// ==========================================
// SCENE 8: SINE WAVE / OCEAN SURFACE
// ==========================================
let waveOffset = 0;

function renderWave(dt) {
  waveOffset += 0.06 * speedMultiplier;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(' '));
  const chars = ' .~:;+=xX$#@';

  for (let x = 0; x < cols; x++) {
    const y1 = Math.sin((x * 0.12) + waveOffset) * (rows * 0.2);
    const y2 = Math.cos((x * 0.05) - waveOffset * 0.8) * (rows * 0.15);
    const y3 = Math.sin((x * 0.25) + waveOffset * 1.5) * (rows * 0.08);

    const waveHeight = Math.floor(rows * 0.5 + y1 + y2 + y3);

    for (let y = 0; y < rows; y++) {
      if (y === waveHeight) {
        grid[y][x] = '^';
      } else if (y > waveHeight) {
        const depth = y - waveHeight;
        const charIdx = Math.min(chars.length - 1, Math.floor(depth * 0.8));
        grid[y][x] = chars[charIdx];
      }
    }
  }

  return grid.map(row => row.join('')).join('\n');
}

// ==========================================
// MAIN LOOP & EVENT HANDLERS
// ==========================================
function animate(currentTime) {
  requestAnimationFrame(animate);

  const dt = (currentTime - lastFrameTime) / 1000;
  lastFrameTime = currentTime;

  // FPS calculation
  frameCount++;
  fpsTimer += dt;
  if (fpsTimer >= 0.5) {
    const fps = Math.round(frameCount / fpsTimer);
    fpsDisplay.textContent = `FPS: ${fps}`;
    frameCount = 0;
    fpsTimer = 0;
  }

  if (isPaused) return;

  let frame = '';
  switch (currentScene) {
    case 'bb':
      frame = renderBB(dt);
      break;
    case 'bb-fire':
      frame = renderBBFire(dt);
      break;
    case 'bb-twister':
      frame = renderBBTwisterScene(dt);
      break;
    case 'donut':
      frame = renderDonut(dt);
      break;
    case 'cube':
      frame = renderCube(dt);
      break;
    case 'matrix':
      frame = renderMatrix(dt);
      break;
    case 'tunnel':
      frame = renderTunnel(dt);
      break;
    case 'wave':
      frame = renderWave(dt);
      break;
    default:
      frame = renderBB(dt);
  }

  display.textContent = frame;
}

requestAnimationFrame(animate);

// Scene buttons
sceneButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    sceneButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentScene = btn.dataset.scene;
    if (currentScene === 'matrix') initMatrix();
    if (currentScene.startsWith('bb')) initFire();
  });
});

// Speed slider
speedSlider.addEventListener('input', (e) => {
  speedMultiplier = parseFloat(e.target.value);
  speedVal.textContent = `${speedMultiplier.toFixed(1)}x`;
});

// Theme selector
themeSelect.addEventListener('change', (e) => {
  document.body.className = `${e.target.value} ${btnToggleCrt.classList.contains('active') ? 'crt-active' : ''}`;
});

// CRT toggle
btnToggleCrt.addEventListener('click', () => {
  const active = btnToggleCrt.classList.toggle('active');
  document.body.classList.toggle('crt-active', active);
  btnToggleCrt.textContent = active ? 'CRT: ON' : 'CRT: OFF';
});

// Pause / Play
btnPause.addEventListener('click', () => {
  isPaused = !isPaused;
  btnPause.textContent = isPaused ? '▶ PLAY' : '⏸ PAUSE';
  btnPause.classList.toggle('active', isPaused);
});

// Fullscreen
btnFullscreen.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
    btnFullscreen.textContent = '✖ EXIT';
  } else {
    document.exitFullscreen().catch(() => {});
    btnFullscreen.textContent = '⛶ FULL';
  }
});
