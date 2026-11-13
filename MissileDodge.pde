// =============================================
//  Missile Dodge - 떨어지는 미사일 피하기 게임
//  조작: ← → (또는 A / D) 이동, R 재시작
// =============================================

Player player;
ArrayList<Missile> missiles = new ArrayList<Missile>();
ArrayList<Particle> particles = new ArrayList<Particle>();

boolean leftPressed = false;
boolean rightPressed = false;

int state = 0;          // 0: 시작 화면, 1: 플레이 중, 2: 게임 오버
float score = 0;
int bestScore = 0;
int spawnTimer = 0;
float difficulty = 1;   // 시간이 지날수록 증가

void setup() {
  size(480, 720);
  textAlign(CENTER, CENTER);
  resetGame();
}

void resetGame() {
  player = new Player();
  missiles.clear();
  particles.clear();
  score = 0;
  spawnTimer = 0;
  difficulty = 1;
}

void draw() {
  background(18, 20, 35);
  drawStars();

  if (state == 0) {
    drawTitle();
    return;
  }

  if (state == 1) {
    updateGame();
  }

  // 그리기
  for (Missile m : missiles) m.display();
  for (Particle p : particles) p.display();
  if (state == 1) player.display();

  // 파티클 업데이트 (게임 오버 후에도 폭발 효과 유지)
  for (int i = particles.size() - 1; i >= 0; i--) {
    particles.get(i).update();
    if (particles.get(i).dead()) particles.remove(i);
  }

  drawHUD();
  if (state == 2) drawGameOver();
}

void updateGame() {
  score += 1.0 / 60;                 // 초 단위 점수
  difficulty = 1 + score / 15.0;     // 15초마다 난이도 +1

  // 미사일 생성: 난이도가 오를수록 더 자주
  spawnTimer--;
  if (spawnTimer <= 0) {
    missiles.add(new Missile(difficulty));
    spawnTimer = int(max(8, 45 / difficulty)) + int(random(10));
  }

  player.update();

  for (int i = missiles.size() - 1; i >= 0; i--) {
    Missile m = missiles.get(i);
    m.update();

    if (m.hits(player)) {
      explode(player.x, player.y);
      state = 2;
      bestScore = max(bestScore, int(score));
      return;
    }

    if (m.y > height + 40) {
      // 바닥에 닿으면 작은 폭발
      explodeSmall(m.x, height - 5);
      missiles.remove(i);
    }
  }
}

// ---------------- 화면 요소 ----------------

void drawStars() {
  randomSeed(7);   // 매 프레임 같은 위치에 별
  noStroke();
  for (int i = 0; i < 60; i++) {
    fill(255, random(40, 140));
    float sx = random(width);
    float sy = (random(height) + frameCount * 0.3 * random(0.5, 1.5)) % height;
    circle(sx, sy, random(1, 3));
  }
  randomSeed(millis());
}

void drawHUD() {
  fill(255);
  textSize(20);
  textAlign(LEFT, TOP);
  text("SCORE " + int(score), 15, 12);
  textAlign(RIGHT, TOP);
  text("BEST " + bestScore, width - 15, 12);
  textAlign(CENTER, CENTER);
}

void drawTitle() {
  fill(255, 90, 70);
  textSize(48);
  text("MISSILE DODGE", width / 2, height / 2 - 60);
  fill(255);
  textSize(18);
  text("LEFT / RIGHT  or  A / D  to move", width / 2, height / 2 + 10);
  if (frameCount / 30 % 2 == 0) {
    text("Press SPACE to start", width / 2, height / 2 + 60);
  }
}

void drawGameOver() {
  fill(0, 150);
  rect(0, 0, width, height);
  fill(255, 90, 70);
  textSize(48);
  text("GAME OVER", width / 2, height / 2 - 40);
  fill(255);
  textSize(22);
  text("Score: " + int(score) + "   Best: " + bestScore, width / 2, height / 2 + 15);
  textSize(18);
  text("Press R to restart", width / 2, height / 2 + 60);
}

// ---------------- 입력 ----------------

void keyPressed() {
  if (keyCode == LEFT  || key == 'a' || key == 'A') leftPressed = true;
  if (keyCode == RIGHT || key == 'd' || key == 'D') rightPressed = true;

  if (state == 0 && key == ' ') {
    resetGame();
    state = 1;
  }
  if (state == 2 && (key == 'r' || key == 'R')) {
    resetGame();
    state = 1;
  }
}

void keyReleased() {
  if (keyCode == LEFT  || key == 'a' || key == 'A') leftPressed = false;
  if (keyCode == RIGHT || key == 'd' || key == 'D') rightPressed = false;
}

// ---------------- 폭발 효과 ----------------

void explode(float x, float y) {
  for (int i = 0; i < 60; i++) particles.add(new Particle(x, y, 6));
}

void explodeSmall(float x, float y) {
  for (int i = 0; i < 8; i++) particles.add(new Particle(x, y, 2.5));
}

// =============================================
//  클래스
// =============================================

class Player {
  float x, y;
  float vx = 0;
  float w = 36, h = 40;
  float accel = 1.2, maxSpeed = 8, friction = 0.85;

  Player() {
    x = width / 2;
    y = height - 60;
  }

  void update() {
    if (leftPressed)  vx -= accel;
    if (rightPressed) vx += accel;
    vx *= friction;                       // 미끄러지듯 부드러운 이동
    vx = constrain(vx, -maxSpeed, maxSpeed);
    x += vx;
    x = constrain(x, w / 2, width - w / 2);
  }

  void display() {
    pushMatrix();
    translate(x, y);
    rotate(vx * 0.03);                    // 이동 방향으로 살짝 기울기
    noStroke();
    // 몸통 (삼각형 비행기)
    fill(80, 200, 255);
    triangle(0, -h / 2, -w / 2, h / 2, w / 2, h / 2);
    // 조종석
    fill(255);
    ellipse(0, 2, 10, 14);
    // 엔진 불꽃
    fill(255, random(120, 200), 0);
    triangle(-7, h / 2, 7, h / 2, 0, h / 2 + random(8, 16));
    popMatrix();
  }
}

class Missile {
  float x, y;
  float speed;
  float r = 9;            // 충돌 반경
  int warning = 40;       // 떨어지기 전 경고 표시 프레임

  Missile(float diff) {
    x = random(20, width - 20);
    y = -40;
    speed = random(3, 5) + diff * 1.2;
  }

  void update() {
    if (warning > 0) {
      warning--;
      return;
    }
    y += speed;
  }

  void display() {
    // 낙하 전: 화면 위에 깜빡이는 경고 표시
    if (warning > 0) {
      if (warning / 5 % 2 == 0) {
        fill(255, 60, 60);
        noStroke();
        triangle(x, 48, x - 10, 32, x + 10, 32);
      }
      return;
    }

    pushMatrix();
    translate(x, y);
    noStroke();
    // 불꽃 꼬리
    fill(255, random(100, 180), 0, 200);
    ellipse(0, -22, 8, random(14, 22));
    // 몸체
    fill(200);
    rect(-5, -18, 10, 26, 3);
    // 탄두
    fill(255, 70, 60);
    triangle(-5, 8, 5, 8, 0, 20);
    // 날개
    fill(150);
    triangle(-5, -18, -11, -10, -5, -10);
    triangle(5, -18, 11, -10, 5, -10);
    popMatrix();
  }

  boolean hits(Player p) {
    if (warning > 0) return false;
    // 미사일 탄두(원) vs 플레이어(조금 작게 잡은 원) 충돌
    float d = dist(x, y + 10, p.x, p.y + 5);
    return d < r + p.w * 0.38;
  }
}

class Particle {
  float x, y, vx, vy;
  float life = 255;
  float size;

  Particle(float x, float y, float power) {
    this.x = x;
    this.y = y;
    float a = random(TWO_PI);
    float s = random(1, power);
    vx = cos(a) * s;
    vy = sin(a) * s;
    size = random(3, 8);
  }

  void update() {
    x += vx;
    y += vy;
    vy += 0.08;      // 중력
    life -= 6;
  }

  void display() {
    noStroke();
    fill(255, random(80, 200), 0, life);
    circle(x, y, size);
  }

  boolean dead() {
    return life <= 0;
  }
}
