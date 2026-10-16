/**
 * ASCII.VIBES - Animated ASCII Engine
 */

const display = document.getElementById('ascii-display');
const fpsDisplay = document.getElementById('fps-display');
const speedSlider = document.getElementById('speed-slider');
const speedVal = document.getElementById('speed-val');
const themeSelect = document.getElementById('theme-select');
const btnToggleCrt = document.getElementById('btn-toggle-crt');
const btnPause = document.getElementById('btn-pause');
const btnFullscreen = document.getElementById('btn-fullscreen');
const sceneButtons = document.querySelectorAll('.btn-group .btn');

let currentScene = 'donut';
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
  const height = window.innerHeight - 140; // account for header and footer

  // VT323 or monospace aspect ratio: char width is ~0.6 * char height
  const charWidth = width < 768 ? 6 : 9;
  const charHeight = width < 768 ? 10 : 15;

  cols = Math.min(110, Math.max(45, Math.floor(width / charWidth)));
  rows = Math.min(50, Math.max(24, Math.floor(height / charHeight)));

  if (display) {
    display.style.fontSize = width < 768 ? '10px' : '14px';
    display.style.lineHeight = width < 768 ? '9px' : '12px';
  }
}

calculateGridSize();
window.addEventListener('resize', () => {
  calculateGridSize();
  if (currentScene === 'matrix') initMatrix();
});

// ==========================================
// SCENE 1: 3D TORUS (THE DONUT)
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

  // Theta revolves around center of donut circle
  for (let j = 0; j < 6.28; j += 0.07) {
    const cosj = Math.cos(j), sinj = Math.sin(j);

    // Phi revolves around cross-sectional center
    for (let i = 0; i < 6.28; i += 0.02) {
      const sini = Math.sin(i), cosi = Math.cos(i);

      const h = cosj + 2; // R1 + R2*cos(theta)
      const D = 1 / (sini * h * sinA + sinj * cosA + 5); // 1 / z
      const t = sini * h * cosA - sinj * sinA;

      const x = Math.floor(cols / 2 + (cols * 0.42) * D * (cosi * h * cosB - t * sinB));
      const y = Math.floor(rows / 2 + (rows * 0.42) * D * (cosi * h * sinB + t * cosB));
      const o = x + cols * y;

      // Luminance / lighting normal calculation
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
// SCENE 2: 3D ROTATING WIREFRAME CUBE
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

  // Vertices of cube centered at origin
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

  // Rotate a 3D point
  function rotate([x, y, z]) {
    // Rot X
    let y1 = y * Math.cos(cubeRotX) - z * Math.sin(cubeRotX);
    let z1 = y * Math.sin(cubeRotX) + z * Math.cos(cubeRotX);
    let x1 = x;
    // Rot Y
    let x2 = x1 * Math.cos(cubeRotY) + z1 * Math.sin(cubeRotY);
    let z2 = -x1 * Math.sin(cubeRotY) + z1 * Math.cos(cubeRotY);
    let y2 = y1;
    // Rot Z
    let x3 = x2 * Math.cos(cubeRotZ) - y2 * Math.sin(cubeRotZ);
    let y3 = x2 * Math.sin(cubeRotZ) + y2 * Math.cos(cubeRotZ);
    let z3 = z2;
    return [x3, y3, z3];
  }

  // Draw 3D Line in ASCII
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

  // 12 Edges
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0], // back
    [4, 5], [5, 6], [6, 7], [7, 4], // front
    [0, 4], [1, 5], [2, 6], [3, 7], // connectors
  ];

  const chars = ['#', '*', '+', '=', '@', '%'];
  edges.forEach(([i, j], idx) => {
    drawLine(rotVertices[i], rotVertices[j], chars[idx % chars.length]);
  });

  return grid.map(row => row.join('')).join('\n');
}

// ==========================================
// SCENE 3: MATRIX DIGITAL RAIN
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
          // Bright lead character
          grid[y][c] = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        } else if (l < drop.length - 1) {
          // Body trail
          if (!drop.chars[l] || Math.random() < 0.05) {
            drop.chars[l] = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          }
          grid[y][c] = drop.chars[l];
        } else {
          // Fading tail
          grid[y][c] = '.';
        }
      }
    }
  }

  return grid.map(row => row.join('')).join('\n');
}

// ==========================================
// SCENE 4: WARP TUNNEL
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
      // Perspective depth mapped to concentric cycles
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
// SCENE 5: SINE WAVE / OCEAN SURFACE
// ==========================================
let waveOffset = 0;

function renderWave(dt) {
  waveOffset += 0.06 * speedMultiplier;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(' '));

  const chars = ' .~:;+=xX$#@';

  for (let x = 0; x < cols; x++) {
    // Combine 3 sine waves for organic interference
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
      frame = renderDonut(dt);
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
