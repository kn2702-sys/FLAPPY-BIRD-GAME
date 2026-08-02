import { Bird, Cloud, GameConfig, GameState, GameWorld, Particle, Pipe, Star } from './types';

const DEFAULT_CONFIG: GameConfig = {
  width: 400,
  height: 700,
  gravity: 0.45,
  flapStrength: -7.8,
  pipeSpeed: 2.8,
  pipeGap: 155,
  pipeWidth: 62,
  pipeSpacing: 220,
  groundHeight: 80,
  birdSize: 34,
};

export function createConfig(overrides?: Partial<GameConfig>): GameConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}

export function createBird(config: GameConfig): Bird {
  return {
    x: config.width * 0.28,
    y: config.height * 0.45,
    velocity: 0,
    rotation: 0,
    wingFrame: 0,
    wingTimer: 0,
    width: config.birdSize,
    height: config.birdSize * 0.8,
  };
}

export function createClouds(config: GameConfig, count = 6): Cloud[] {
  const clouds: Cloud[] = [];
  for (let i = 0; i < count; i++) {
    clouds.push({
      x: Math.random() * config.width * 1.5,
      y: Math.random() * config.height * 0.35 + 20,
      width: Math.random() * 60 + 40,
      height: Math.random() * 25 + 15,
      speed: Math.random() * 0.3 + 0.15,
      opacity: Math.random() * 0.3 + 0.15,
    });
  }
  return clouds;
}

export function createStars(config: GameConfig, count = 30): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * config.width,
      y: Math.random() * config.height * 0.4,
      size: Math.random() * 2 + 0.5,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.05 + 0.02,
    });
  }
  return stars;
}

export function createWorld(bestScore = 0): GameWorld {
  const config = createConfig();
  return {
    bird: createBird(config),
    pipes: [],
    clouds: createClouds(config),
    particles: [],
    stars: createStars(config),
    groundOffset: 0,
    score: 0,
    bestScore,
    state: 'IDLE',
    frameCount: 0,
    shakeIntensity: 0,
    flashAlpha: 0,
    combo: 0,
    lastScoreTime: 0,
  };
}

export function flap(world: GameWorld, config: GameConfig): void {
  if (world.state === 'GAME_OVER') return;

  if (world.state === 'IDLE') {
    world.state = 'PLAYING';
  }

  if (world.state === 'PLAYING') {
    world.bird.velocity = config.flapStrength;
    world.bird.wingFrame = 1;
    world.bird.wingTimer = 8;

    // Flap particles
    for (let i = 0; i < 5; i++) {
      world.particles.push({
        x: world.bird.x - 5,
        y: world.bird.y + 5,
        vx: -Math.random() * 2 - 1,
        vy: Math.random() * 2 + 1,
        life: 20,
        maxLife: 20,
        size: Math.random() * 3 + 1,
        color: `hsla(45, 100%, ${70 + Math.random() * 20}%, `,  
        type: 'feather',
      });
    }
  }
}

function addPipe(world: GameWorld, config: GameConfig): void {
  const playAreaHeight = config.height - config.groundHeight;
  const minGapY = 80;
  const maxGapY = playAreaHeight - config.pipeGap - 80;
  const gapY = Math.random() * (maxGapY - minGapY) + minGapY;

  const pipeColors = ['#2ECC71', '#27AE60', '#1ABC9C', '#16A085', '#2ECC71'];
  const color = pipeColors[Math.floor(Math.random() * pipeColors.length)];

  world.pipes.push({
    x: config.width + 10,
    gapY,
    gapSize: config.pipeGap,
    width: config.pipeWidth,
    scored: false,
    color,
  });
}

function checkCollision(world: GameWorld, config: GameConfig): boolean {
  const bird = world.bird;
  const bx = bird.x - bird.width * 0.4;
  const by = bird.y - bird.height * 0.4;
  const bw = bird.width * 0.8;
  const bh = bird.height * 0.8;

  // Ground collision
  const groundY = config.height - config.groundHeight;
  if (by + bh >= groundY) {
    return true;
  }

  // Ceiling collision
  if (by <= 0) {
    bird.y = bird.height * 0.4;
    bird.velocity = 0;
  }

  // Pipe collision
  for (const pipe of world.pipes) {
    const px = pipe.x;
    const pw = pipe.width;

    // Check horizontal overlap
    if (bx + bw > px && bx < px + pw) {
      // Check if bird is in the gap
      const topPipeBottom = pipe.gapY;
      const bottomPipeTop = pipe.gapY + pipe.gapSize;

      if (by < topPipeBottom || by + bh > bottomPipeTop) {
        return true;
      }
    }
  }

  return false;
}

function addScoreParticles(world: GameWorld): void {
  const now = Date.now();
  if (now - world.lastScoreTime < 300) {
    world.combo++;
  } else {
    world.combo = 1;
  }
  world.lastScoreTime = now;

  const count = Math.min(world.combo * 3, 15);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = Math.random() * 3 + 2;
    world.particles.push({
      x: world.bird.x,
      y: world.bird.y - 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 30,
      maxLife: 30,
      size: Math.random() * 4 + 2,
      color: `hsla(${50 + Math.random() * 30}, 100%, 60%, `,
      type: 'star',
    });
  }
}

function addDeathParticles(world: GameWorld): void {
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
    world.particles.push({
      x: world.bird.x,
      y: world.bird.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 40,
      maxLife: 40,
      size: Math.random() * 5 + 2,
      color: `hsla(${Math.random() * 60 + 10}, 100%, ${50 + Math.random() * 30}%, `,
      type: 'spark',
    });
  }
}

export function update(world: GameWorld, config: GameConfig): void {
  world.frameCount++;

  // Update clouds
  for (const cloud of world.clouds) {
    cloud.x -= cloud.speed;
    if (cloud.x + cloud.width < 0) {
      cloud.x = config.width + Math.random() * 100;
      cloud.y = Math.random() * config.height * 0.35 + 20;
    }
  }

  // Update stars
  for (const star of world.stars) {
    star.twinkle += star.twinkleSpeed;
  }

  if (world.state === 'IDLE') {
    // Idle bobbing animation
    world.bird.y = config.height * 0.45 + Math.sin(world.frameCount * 0.06) * 12;
    world.bird.wingTimer++;
    if (world.bird.wingTimer > 6) {
      world.bird.wingTimer = 0;
      world.bird.wingFrame = (world.bird.wingFrame + 1) % 3;
    }
    world.bird.rotation = 0;
    // Still scroll ground in idle
    world.groundOffset = (world.groundOffset + config.pipeSpeed * 0.5) % 24;
    return;
  }

  if (world.state === 'GAME_OVER') {
    // Continue bird falling
    world.bird.velocity += config.gravity;
    world.bird.y += world.bird.velocity;
    const groundY = config.height - config.groundHeight;
    if (world.bird.y + world.bird.height / 2 >= groundY) {
      world.bird.y = groundY - world.bird.height / 2;
      world.bird.velocity = 0;
    }
    world.bird.rotation = Math.min(world.bird.rotation + 0.08, Math.PI / 2);

    // Update particles
    updateParticles(world);

    // Decrease effects
    world.shakeIntensity *= 0.9;
    world.flashAlpha *= 0.92;

    return;
  }

  // PLAYING state
  const bird = world.bird;

  // Bird physics
  bird.velocity += config.gravity;
  bird.y += bird.velocity;

  // Bird rotation based on velocity
  const targetRotation = Math.max(-0.5, Math.min(bird.velocity * 0.08, Math.PI / 2.5));
  bird.rotation += (targetRotation - bird.rotation) * 0.15;

  // Wing animation
  bird.wingTimer--;
  if (bird.wingTimer <= 0) {
    bird.wingTimer = 6;
    bird.wingFrame = (bird.wingFrame + 1) % 3;
  }

  // Ground scroll
  world.groundOffset = (world.groundOffset + config.pipeSpeed) % 24;

  // Pipe management
  const lastPipe = world.pipes[world.pipes.length - 1];
  if (!lastPipe || lastPipe.x < config.width - config.pipeSpacing) {
    addPipe(world, config);
  }

  // Move pipes
  for (const pipe of world.pipes) {
    pipe.x -= config.pipeSpeed;

    // Score check
    if (!pipe.scored && pipe.x + pipe.width < bird.x) {
      pipe.scored = true;
      world.score++;
      addScoreParticles(world);
    }
  }

  // Remove off-screen pipes
  world.pipes = world.pipes.filter(p => p.x + p.width > -10);

  // Collision detection
  if (checkCollision(world, config)) {
    world.state = 'GAME_OVER';
    world.shakeIntensity = 12;
    world.flashAlpha = 0.6;
    if (world.score > world.bestScore) {
      world.bestScore = world.score;
    }
    addDeathParticles(world);
  }

  // Update particles
  updateParticles(world);
}

function updateParticles(world: GameWorld): void {
  for (const p of world.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.life--;
  }
  world.particles = world.particles.filter(p => p.life > 0);
}

export function resetGame(world: GameWorld): void {
  const config = createConfig();
  const bestScore = world.bestScore;
  const clouds = world.clouds;
  const stars = world.stars;

  world.bird = createBird(config);
  world.pipes = [];
  world.particles = [];
  world.score = 0;
  world.state = 'IDLE';
  world.frameCount = 0;
  world.shakeIntensity = 0;
  world.flashAlpha = 0;
  world.combo = 0;
  world.lastScoreTime = 0;
  world.bestScore = bestScore;
  world.clouds = clouds;
  world.stars = stars;
}

export function getMedal(score: number): { name: string; color: string; emoji: string } | null {
  if (score >= 40) return { name: 'Platinum', color: '#E5E4E2', emoji: '💎' };
  if (score >= 30) return { name: 'Gold', color: '#FFD700', emoji: '🥇' };
  if (score >= 20) return { name: 'Silver', color: '#C0C0C0', emoji: '🥈' };
  if (score >= 10) return { name: 'Bronze', color: '#CD7F32', emoji: '🥉' };
  return null;
}