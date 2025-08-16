// ===================== KONFIGURASI DASAR =====================
const COLS = 10, ROWS = 20, BLOCK = 25;
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

// Setup untuk layar HD
const scale = window.devicePixelRatio || 1;
canvas.width = COLS * BLOCK * scale;
canvas.height = ROWS * BLOCK * scale;
canvas.style.width = (COLS * BLOCK) + 'px';
canvas.style.height = (ROWS * BLOCK) + 'px';
ctx.scale(scale, scale);

// Warna Block
const COLORS = [null, '#22c1c3', '#ffb86b', '#9ae66e', '#7dd3fc', '#f6a6ff', '#ffd36e', '#8ad0ff'];

// Bentuk Tetromino
const SHAPES = {
  I: [[1,1,1,1]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1]],
  S: [[0,1,1],[1,1,0]],
  Z: [[1,1,0],[0,1,1]],
  J: [[1,0,0],[1,1,1]],
  L: [[0,0,1],[1,1,1]]
};
const SHAPE_KEYS = Object.keys(SHAPES);

// ===================== STATE GAME =====================
let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let current = null, nextPiece = null;
let currentPos = {x:0, y:0};
let score = 0, level = 0, lines = 0;
let dropCounter = 0, dropInterval = 1000;
let lastTime = 0;
let paused = false, gameOver = false;
let isHardDropping = false;

// Konfigurasi Speed
const BASE_SPEED = 1000;
const SPEED_INCREASE_PER_LEVEL = 30;
const MIN_SPEED = 200;
const SCORE_PER_LEVEL = 2000;

// ===================== FUNGSI UTAMA =====================

// Inisialisasi Game
function initGame() {
  board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
  score = 0; 
  level = 0; 
  lines = 0;
  dropInterval = BASE_SPEED;
  paused = false; 
  gameOver = false;
  isHardDropping = false;
  nextPiece = randomPiece();
  spawnPiece();
  updateHud();
  updatePauseButton();
}

// Spawn Piece Baru
function spawnPiece() {
  current = {
    shape: SHAPES[nextPiece].map(row => [...row]),
    id: SHAPE_KEYS.indexOf(nextPiece) + 1
  };
  nextPiece = randomPiece();
  currentPos = {
    x: Math.floor((COLS - current.shape[0].length) / 2),
    y: 0
  };
  if (collides()) gameOver = true;
  updateHud();
}

// Generate Piece Acak
function randomPiece() {
  return SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
}

// Cek Tabrakan
function collides() {
  for (let y = 0; y < current.shape.length; y++) {
    for (let x = 0; x < current.shape[y].length; x++) {
      if (current.shape[y][x]) {
        const nx = currentPos.x + x;
        const ny = currentPos.y + y;
        if (nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && board[ny][nx])) {
          return true;
        }
      }
    }
  }
  return false;
}

// Update Level Berdasarkan Score
function updateLevel() {
  const newLevel = Math.floor(score / SCORE_PER_LEVEL);
  if (newLevel > level) {
    level = newLevel;
    dropInterval = Math.max(MIN_SPEED, BASE_SPEED - (level * SPEED_INCREASE_PER_LEVEL));
  }
}

// ===================== KONTROL GAME =====================

// Putar Block
function rotatePiece() {
  if (paused || gameOver) return;
  
  const rotated = current.shape[0].map((_, i) =>
    current.shape.map(row => row[i]).reverse()
  );
  const original = current.shape;
  current.shape = rotated;

  // Wall kick
  const offsets = [0, -1, 1, -2, 2];
  for (const offset of offsets) {
    currentPos.x += offset;
    if (!collides()) return;
    currentPos.x -= offset;
  }
  current.shape = original;
}

// Gerakan Kiri/Kanan
function move(dx) {
  if (paused || gameOver) return;
  currentPos.x += dx;
  if (collides()) currentPos.x -= dx;
}

// Hard Drop (Fix Double Click)
function hardDrop() {
  if (paused || gameOver || isHardDropping) return;
  
  isHardDropping = true;
  
  while (!collides()) currentPos.y++;
  currentPos.y--;
  mergeToBoard();
  clearLines();
  spawnPiece();
  
  setTimeout(() => {
    isHardDropping = false;
  }, 300);
}

// Gabungkan ke Board
function mergeToBoard() {
  for (let y = 0; y < current.shape.length; y++) {
    for (let x = 0; x < current.shape[y].length; x++) {
      if (current.shape[y][x] && currentPos.y + y >= 0) {
        board[currentPos.y + y][currentPos.x + x] = current.id;
      }
    }
  }
}

// Hapus Garis Lengkap
function clearLines() {
  let linesCleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(cell => cell)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
      linesCleared++;
      y++;
    }
  }

  if (linesCleared) {
    lines += linesCleared;
    score += [100, 300, 500, 800][Math.min(linesCleared, 4) - 1] * (level + 1);
    updateLevel();
    updateHud();
  }
}

// ===================== RENDER GAME =====================

// Gambar Game
function draw() {
  // Clear board
  ctx.fillStyle = '#071425';
  ctx.fillRect(0, 0, COLS * BLOCK, ROWS * BLOCK);

  // Gambar block yang sudah jatuh
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x]) {
        drawBlock(x, y, COLORS[board[y][x]]);
      } else {
        drawEmpty(x, y);
      }
    }
  }

  // Gambar ghost piece
  if (!gameOver && !paused) {
    const ghostY = getGhostY();
    ctx.globalAlpha = 0.3;
    for (let y = 0; y < current.shape.length; y++) {
      for (let x = 0; x < current.shape[y].length; x++) {
        if (current.shape[y][x]) {
          drawBlock(currentPos.x + x, ghostY + y, COLORS[current.id]);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // Gambar piece saat ini
  if (!gameOver && !paused) {
    for (let y = 0; y < current.shape.length; y++) {
      for (let x = 0; x < current.shape[y].length; x++) {
        if (current.shape[y][x] && currentPos.y + y >= 0) {
          drawBlock(currentPos.x + x, currentPos.y + y, COLORS[current.id]);
        }
      }
    }
  }

  // Game over overlay
  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, COLS * BLOCK, ROWS * BLOCK);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('GAME OVER', COLS * BLOCK / 2, ROWS * BLOCK / 2 - 15);
    ctx.font = '14px sans-serif';
    ctx.fillText('Tekan Reset', COLS * BLOCK / 2, ROWS * BLOCK / 2 + 15);
  }

  // Pause overlay
  if (paused && !gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, COLS * BLOCK, ROWS * BLOCK);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('PAUSE', COLS * BLOCK / 2, ROWS * BLOCK / 2);
  }
}

// Gambar Block
function drawBlock(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, BLOCK - 2);
}

// Gambar Tempat Kosong
function drawEmpty(x, y) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.strokeRect(x * BLOCK + 0.5, y * BLOCK + 0.5, BLOCK - 1, BLOCK - 1);
}

// Dapatkan Posisi Ghost
function getGhostY() {
  let y = currentPos.y;
  while (!collidesAt(currentPos.x, y + 1) && y < ROWS - current.shape.length) y++;
  return y;
}

// Cek Tabrakan di Posisi Tertentu
function collidesAt(x, y) {
  for (let py = 0; py < current.shape.length; py++) {
    for (let px = 0; px < current.shape[py].length; px++) {
      if (current.shape[py][px]) {
        const nx = x + px;
        const ny = y + py;
        if (nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && board[ny][nx])) {
          return true;
        }
      }
    }
  }
  return false;
}

// ===================== HUD & TOMBOL =====================

// Update HUD
function updateHud() {
  document.getElementById('score').textContent = score;
  document.getElementById('level').textContent = level;
  document.getElementById('lines').textContent = lines;

  // Gambar preview piece berikutnya
  const box = document.getElementById('nextBox');
  box.innerHTML = '';
  const canvas = document.createElement('canvas');
  const size = 100;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#071425';
  ctx.fillRect(0, 0, size, size);

  const shape = SHAPES[nextPiece];
  const cellSize = Math.min(size / Math.max(shape.length, 4), size / Math.max(shape[0].length, 4));
  const offsetX = (size - shape[0].length * cellSize) / 2;
  const offsetY = (size - shape.length * cellSize) / 2;

  ctx.fillStyle = COLORS[SHAPE_KEYS.indexOf(nextPiece) + 1];
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        ctx.fillRect(
          offsetX + x * cellSize + 1,
          offsetY + y * cellSize + 1,
          cellSize - 2,
          cellSize - 2
        );
      }
    }
  }

  box.appendChild(canvas);
}

// Update Tombol Pause
function updatePauseButton() {
  const pauseBtn = document.getElementById('pauseBtn');
  pauseBtn.innerHTML = paused ? '⏸ Lanjut' : '⏸ Pause';
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  updatePauseButton();
}

// Setup Tombol dengan Anti Double Click
function setupButton(id, action, repeat = false) {
  const btn = document.getElementById(id);
  let interval;
  let timeout;
  let isActive = false;

  const startAction = () => {
    if (gameOver || paused || isActive) return;
    isActive = true;
    action();
    if (repeat) {
      timeout = setTimeout(() => {
        interval = setInterval(action, 80);
      }, 100);
    }
  };

  const stopAction = () => {
    isActive = false;
    clearTimeout(timeout);
    clearInterval(interval);
  };

  // Untuk touch device
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startAction();
  }, {passive: false});

  btn.addEventListener('touchend', stopAction);
  btn.addEventListener('touchcancel', stopAction);

  // Untuk desktop
  btn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startAction();
  });

  btn.addEventListener('mouseup', stopAction);
  btn.addEventListener('mouseleave', stopAction);
}

// ===================== GAME LOOP =====================

function gameLoop(time = 0) {
  if (!lastTime) lastTime = time;
  const delta = time - lastTime;
  lastTime = time;

  if (!paused && !gameOver) {
    dropCounter += delta;
    if (dropCounter > dropInterval) {
      currentPos.y++;
      if (collides()) {
        currentPos.y--;
        mergeToBoard();
        clearLines();
        spawnPiece();
      }
      dropCounter = 0;
    }
  }

  draw();
  requestAnimationFrame(gameLoop);
}

// ===================== INISIALISASI =====================

// Pasang event listener
setupButton('leftBtn', () => move(-1), true);
setupButton('rightBtn', () => move(1), true);
setupButton('hardDropBtn', hardDrop);
setupButton('rotateBtn', rotatePiece);

document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('restartBtn').addEventListener('click', initGame);

// Handle resize window
window.addEventListener('resize', () => {
  const scale = window.devicePixelRatio || 1;
  canvas.width = COLS * BLOCK * scale;
  canvas.height = ROWS * BLOCK * scale;
  canvas.style.width = (COLS * BLOCK) + 'px';
  canvas.style.height = (ROWS * BLOCK) + 'px';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(scale, scale);
  draw();
});

// Mulai game
initGame();
requestAnimationFrame(gameLoop);
