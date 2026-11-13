// =============================================
//  Missile Dodge - 떨어지는 미사일 피하기 게임 (p5.js)
// =============================================

let player;
let missiles = [];
let particles = [];

let leftPressed = false;
let rightPressed = false;

let state = 0;          // 0: 시작 화면, 1: 플레이 중, 2: 게임 오버
let score = 0;
let bestScore = 0;
let spawnTimer = 0;
let difficulty = 1;

function setup() {
  createCanvas(480, 720);
  textAlign(CENTER, CENTER);
  textFont("sans-serif");
  // 브라우저에 최고 기록 저장 (지원 안 되면 무시)
  try { bestScore = int(localStorage.getItem("missileBest") || 0); } catch (e) {}
  resetGame();
  setupTouch();
}

function resetGame() {
  player = new Player();
  missiles = [];
  particles = [];
  score = 0;
  spawnTimer = 0;
  difficulty = 1;
}

function draw() {
  background(18, 20, 35);
  drawStars();

  if (state === 0) {
    drawTitle();
    return;
  }

  if (state === 1) updateGame();

  for (const m of missiles) m.display();
  for (const p of particles) p.display();
  if (state === 1) player.display();

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    if (particles[i].dead()) particles.splice(i, 1);
  }

  drawHUD();
  if (state === 2) drawGameOver();
}

function updateGame() {
  score += deltaTime / 1000;          // 실제 경과 시간(초) 기준 점수
  difficulty = 1 + score / 15.0;      // 15초마다 난이도 +1

  spawnTimer--;
  if (spawnTimer <= 0) {
    missiles.push(new Missile(difficulty));
    spawnTimer = int(max(8, 45 / difficulty)) + int(random(10));
  }

  player.update();

  for (let i = missiles.length - 1; i >= 0; i--) {
    const m = missiles[i];
    m.update();

    if (m.hits(player)) {
      explode(player.x, player.y);
      state = 2;
      bestScore = max(bestScore, int(score));
      try { localStorage.setItem("missileBest", bestScore); } catch (e) {}
      return;
    }

    if (m.y > height + 40) {
      explodeSmall(m.x, height - 5);
      missiles.splice(i, 1);
    }
  }
}

// ---------------- 화면 요소 ----------------

function drawStars() {
  randomSeed(7);
  noStroke();
  for (let i = 0; i < 60; i++) {
    fill(255, random(40, 140));
    const sx = random(width);
    const sy = (random(height) + frameCount * 0.3 * random(0.5, 1.5)) % height;
    circle(sx, sy, random(1, 3));
  }
  randomSeed(millis());
}

function drawHUD() {
  fill(255);
  textSize(20);
  textAlign(LEFT, TOP);
  text("SCORE " + int(score), 15, 12);
  textAlign(RIGHT, TOP);
  text("BEST " + bestScore, width - 15, 12);
  textAlign(CENTER, CENTER);
}

function drawTitle() {
  fill(255, 90, 70);
  textSize(48);
  text("MISSILE DODGE", width / 2, height / 2 - 60);
  fill(255);
  textSize(18);
  text("← → 또는 A / D 로 이동", width / 2, height / 2 + 10);
  if (int(frameCount / 30) % 2 === 0) {
    text("스페이스를 눌러 시작", width / 2, height / 2 + 60);
  }
}

function drawGameOver() {
  fill(0, 150);
  rect(0, 0, width, height);
  fill(255, 90, 70);
  textSize(48);
  text("GAME OVER", width / 2, height / 2 - 40);
  fill(255);
  textSize(22);
  text("점수: " + int(score) + "   최고: " + bestScore, width / 2, height / 2 + 15);
  textSize(18);
  text("R 을 눌러 다시 시작", width / 2, height / 2 + 60);
}

// ---------------- 입력 ----------------

function startOrRestart() {
  if (state === 0 || state === 2) {
    resetGame();
    state = 1;
  }
}

function keyPressed() {
  if (keyCode === LEFT_ARROW  || key === 'a' || key === 'A') leftPressed = true;
  if (keyCode === RIGHT_ARROW || key === 'd' || key === 'D') rightPressed = true;

  if (state === 0 && key === ' ') startOrRestart();
  if (state === 2 && (key === 'r' || key === 'R')) startOrRestart();

  // 방향키·스페이스로 페이지가 스크롤되지 않게 막기
  if ([LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW, 32].includes(keyCode)) return false;
}

function keyReleased() {
  if (keyCode === LEFT_ARROW  || key === 'a' || key === 'A') leftPressed = false;
  if (keyCode === RIGHT_ARROW || key === 'd' || key === 'D') rightPressed = false;
}

// 모바일 터치 버튼 연결
function setupTouch() {
  const hold = (id, on, off) => {
    const b = document.getElementById(id);
    b.addEventListener("pointerdown", e => { e.preventDefault(); on(); });
    b.addEventListener("pointerup", off);
    b.addEventListener("pointerleave", off);
    b.addEventListener("pointercancel", off);
  };
  hold("btnLeft",  () => leftPressed = true,  () => leftPressed = false);
  hold("btnRight", () => rightPressed = true, () => rightPressed = false);
  document.getElementById("btnStart").addEventListener("click", startOrRestart);
}

// ---------------- 폭발 효과 ----------------

function explode(x, y) {
  for (let i = 0; i < 60; i++) particles.push(new Particle(x, y, 6));
}

function explodeSmall(x, y) {
  for (let i = 0; i < 8; i++) particles.push(new Particle(x, y, 2.5));
}

// =============================================
//  클래스
// =============================================

class Player {
  constructor() {
    this.x = width / 2;
    this.y = height - 60;
    this.vx = 0;
    this.w = 36;
    this.h = 40;
    this.accel = 1.2;
    this.maxSpeed = 8;
    this.friction = 0.85;
  }

  update() {
    if (leftPressed)  this.vx -= this.accel;
    if (rightPressed) this.vx += this.accel;
    this.vx *= this.friction;
    this.vx = constrain(this.vx, -this.maxSpeed, this.maxSpeed);
    this.x += this.vx;
    this.x = constrain(this.x, this.w / 2, width - this.w / 2);
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.vx * 0.03);
    noStroke();
    fill(80, 200, 255);
    triangle(0, -this.h / 2, -this.w / 2, this.h / 2, this.w / 2, this.h / 2);
    fill(255);
    ellipse(0, 2, 10, 14);
    fill(255, random(120, 200), 0);
    triangle(-7, this.h / 2, 7, this.h / 2, 0, this.h / 2 + random(8, 16));
    pop();
  }
}

class Missile {
  constructor(diff) {
    this.x = random(20, width - 20);
    this.y = -40;
    this.speed = random(3, 5) + diff * 1.2;
    this.r = 9;
    this.warning = 40;   // 떨어지기 전 경고 표시 프레임
  }

  update() {
    if (this.warning > 0) {
      this.warning--;
      return;
    }
    this.y += this.speed;
  }

  display() {
    if (this.warning > 0) {
      if (int(this.warning / 5) % 2 === 0) {
        fill(255, 60, 60);
        noStroke();
        triangle(this.x, 48, this.x - 10, 32, this.x + 10, 32);
      }
      return;
    }

    push();
    translate(this.x, this.y);
    noStroke();
    fill(255, random(100, 180), 0, 200);
    ellipse(0, -22, 8, random(14, 22));
    fill(200);
    rect(-5, -18, 10, 26, 3);
    fill(255, 70, 60);
    triangle(-5, 8, 5, 8, 0, 20);
    fill(150);
    triangle(-5, -18, -11, -10, -5, -10);
    triangle(5, -18, 11, -10, 5, -10);
    pop();
  }

  hits(p) {
    if (this.warning > 0) return false;
    const d = dist(this.x, this.y + 10, p.x, p.y + 5);
    return d < this.r + p.w * 0.38;
  }
}

class Particle {
  constructor(x, y, power) {
    this.x = x;
    this.y = y;
    const a = random(TWO_PI);
    const s = random(1, power);
    this.vx = cos(a) * s;
    this.vy = sin(a) * s;
    this.life = 255;
    this.size = random(3, 8);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.08;
    this.life -= 6;
  }

  display() {
    noStroke();
    fill(255, random(80, 200), 0, this.life);
    circle(this.x, this.y, this.size);
  }

  dead() {
    return this.life <= 0;
  }
}
