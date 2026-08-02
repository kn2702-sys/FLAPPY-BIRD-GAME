import { GameConfig, GameWorld, Pipe, Particle, Star } from './types';

function drawSky(ctx: CanvasRenderingContext2D, config: GameConfig, world: GameWorld) {
  const gradient = ctx.createLinearGradient(0, 0, 0, config.height - config.groundHeight);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.3, '#16213e');
  gradient.addColorStop(0.6, '#0f3460');
  gradient.addColorStop(0.85, '#53a8b6');
  gradient.addColorStop(1, '#79d7be');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, config.width, config.height - config.groundHeight);

  // Sun/moon glow
  const sunX = config.width * 0.78;
  const sunY = config.height * 0.15;
  const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80);
  sunGradient.addColorStop(0, 'rgba(255, 200, 100, 0.8)');
  sunGradient.addColorStop(0.3, 'rgba(255, 180, 80, 0.3)');
  sunGradient.addColorStop(1, 'rgba(255, 150, 50, 0)');
  ctx.fillStyle = sunGradient;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
  ctx.fill();

  // Sun core
  ctx.fillStyle = '#FFE4B5';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 25, 0, Math.PI * 2);
  ctx.fill();

  // Stars
  for (const star of world.stars) {
    const alpha = 0.3 + Math.sin(star.twinkle) * 0.3;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawClouds(ctx: CanvasRenderingContext2D, world: GameWorld) {
  for (const cloud of world.clouds) {
    ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
    ctx.beginPath();
    const cx = cloud.x + cloud.width / 2;
    const cy = cloud.y + cloud.height / 2;
    ctx.ellipse(cx, cy, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Extra puff
    ctx.beginPath();
    ctx.ellipse(cx - cloud.width * 0.25, cy + 2, cloud.width * 0.3, cloud.height * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + cloud.width * 0.2, cy + 1, cloud.width * 0.25, cloud.height * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPipe(ctx: CanvasRenderingContext2D, pipe: Pipe, config: GameConfig) {
  const groundY = config.height - config.groundHeight;
  const capHeight = 26;
  const capOverhang = 6;
  const r = 4;

  // --- Top pipe body ---
  const topGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
  topGrad.addColorStop(0, '#1a8a4a');
  topGrad.addColorStop(0.3, '#2ecc71');
  topGrad.addColorStop(0.5, '#55efc4');
  topGrad.addColorStop(0.7, '#2ecc71');
  topGrad.addColorStop(1, '#1a8a4a');

  ctx.fillStyle = topGrad;
  ctx.beginPath();
  ctx.roundRect(pipe.x, 0, pipe.width, pipe.gapY, [0, 0, r, r]);
  ctx.fill();

  // Top pipe cap
  const capGrad = ctx.createLinearGradient(pipe.x - capOverhang, 0, pipe.x + pipe.width + capOverhang, 0);
  capGrad.addColorStop(0, '#15803d');
  capGrad.addColorStop(0.3, '#22c55e');
  capGrad.addColorStop(0.5, '#4ade80');
  capGrad.addColorStop(0.7, '#22c55e');
  capGrad.addColorStop(1, '#15803d');

  ctx.fillStyle = capGrad;
  ctx.beginPath();
  ctx.roundRect(pipe.x - capOverhang, pipe.gapY - capHeight, pipe.width + capOverhang * 2, capHeight, r);
  ctx.fill();

  // Top pipe border
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(pipe.x - capOverhang, pipe.gapY - capHeight, pipe.width + capOverhang * 2, capHeight, r);
  ctx.stroke();

  // --- Bottom pipe body ---
  const bottomTop = pipe.gapY + pipe.gapSize;
  const bottomHeight = groundY - bottomTop;

  ctx.fillStyle = topGrad;
  ctx.beginPath();
  ctx.roundRect(pipe.x, bottomTop, pipe.width, bottomHeight, [r, r, 0, 0]);
  ctx.fill();

  // Bottom pipe cap
  ctx.fillStyle = capGrad;
  ctx.beginPath();
  ctx.roundRect(pipe.x - capOverhang, bottomTop, pipe.width + capOverhang * 2, capHeight, r);
  ctx.fill();

  // Bottom pipe border
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(pipe.x - capOverhang, bottomTop, pipe.width + capOverhang * 2, capHeight, r);
  ctx.stroke();

  // Highlight stripe on pipes
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(pipe.x + 8, 0, 6, pipe.gapY - capHeight);
  ctx.fillRect(pipe.x + 8, bottomTop + capHeight, 6, bottomHeight - capHeight);
}

function drawBird(ctx: CanvasRenderingContext2D, world: GameWorld, config: GameConfig) {
  const bird = world.bird;
  const size = bird.width;

  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(2, 4, size * 0.48, size * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  const bodyGrad = ctx.createRadialGradient(-3, -3, 0, 0, 0, size * 0.5);
  bodyGrad.addColorStop(0, '#FFE66D');
  bodyGrad.addColorStop(0.6, '#FFC048');
  bodyGrad.addColorStop(1, '#F0932B');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.45, size * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body outline
  ctx.strokeStyle = 'rgba(180, 100, 20, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.45, size * 0.38, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Belly
  ctx.fillStyle = 'rgba(255, 240, 200, 0.6)';
  ctx.beginPath();
  ctx.ellipse(2, 4, size * 0.28, size * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wing
  const wingY = bird.wingFrame === 1 ? -6 : bird.wingFrame === 2 ? 4 : -1;
  ctx.fillStyle = '#E8A020';
  ctx.strokeStyle = 'rgba(150, 80, 10, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(-6, wingY, size * 0.28, size * 0.18, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eye white
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.ellipse(size * 0.18, -size * 0.1, size * 0.16, size * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Pupil
  const isDead = world.state === 'GAME_OVER';
  ctx.fillStyle = isDead ? '#E74C3C' : '#2C3E50';
  ctx.beginPath();
  if (isDead) {
    // X eyes when dead
    const ex = size * 0.2;
    const ey = -size * 0.1;
    const es = size * 0.08;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#E74C3C';
    ctx.beginPath();
    ctx.moveTo(ex - es, ey - es);
    ctx.lineTo(ex + es, ey + es);
    ctx.moveTo(ex + es, ey - es);
    ctx.lineTo(ex - es, ey + es);
    ctx.stroke();
  } else {
    ctx.arc(size * 0.22, -size * 0.08, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    // Eye highlight
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(size * 0.25, -size * 0.12, size * 0.03, 0, Math.PI * 2);
    ctx.fill();
  }

  // Beak
  const beakOpen = bird.wingFrame === 1 ? 3 : 0;
  ctx.fillStyle = '#E74C3C';
  ctx.beginPath();
  ctx.moveTo(size * 0.35, -2);
  ctx.lineTo(size * 0.55, 1 + beakOpen);
  ctx.lineTo(size * 0.35, 4 + beakOpen);
  ctx.closePath();
  ctx.fill();

  // Beak upper
  ctx.fillStyle = '#FF6B6B';
  ctx.beginPath();
  ctx.moveTo(size * 0.35, -2);
  ctx.lineTo(size * 0.55, 1);
  ctx.lineTo(size * 0.35, 1);
  ctx.closePath();
  ctx.fill();

  // Tail feathers
  ctx.fillStyle = '#D4880F';
  ctx.beginPath();
  ctx.ellipse(-size * 0.42, -2, size * 0.12, size * 0.08, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#C07A0A';
  ctx.beginPath();
  ctx.ellipse(-size * 0.42, 4, size * 0.12, size * 0.08, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawGround(ctx: CanvasRenderingContext2D, config: GameConfig, offset: number) {
  const groundY = config.height - config.groundHeight;

  // Dirt
  const dirtGrad = ctx.createLinearGradient(0, groundY, 0, config.height);
  dirtGrad.addColorStop(0, '#D4A574');
  dirtGrad.addColorStop(0.15, '#C4956A');
  dirtGrad.addColorStop(1, '#8B6D4F');
  ctx.fillStyle = dirtGrad;
  ctx.fillRect(0, groundY, config.width, config.groundHeight);

  // Grass top
  const grassGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 18);
  grassGrad.addColorStop(0, '#4CAF50');
  grassGrad.addColorStop(0.5, '#388E3C');
  grassGrad.addColorStop(1, '#2E7D32');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, groundY, config.width, 18);

  // Grass pattern
  ctx.fillStyle = 'rgba(76, 175, 80, 0.6)';
  for (let x = -offset; x < config.width + 24; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x + 12, groundY - 6);
    ctx.lineTo(x + 24, groundY);
    ctx.closePath();
    ctx.fill();
  }

  // Ground line
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(config.width, groundY);
  ctx.stroke();

  // Dirt dots
  ctx.fillStyle = 'rgba(139, 109, 79, 0.3)';
  for (let x = -offset * 0.5 % 40; x < config.width + 40; x += 40) {
    ctx.beginPath();
    ctx.arc(x + 10, groundY + 35, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 30, groundY + 50, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = p.color + `${alpha})`;
    
    if (p.type === 'star') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((1 - alpha) * Math.PI * 2);
      drawStarShape(ctx, 0, 0, 5, p.size, p.size * 0.5);
      ctx.fill();
      ctx.restore();
    } else if (p.type === 'feather') {
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size * 2, p.size, p.vx * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawStarShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerR: number, innerR: number) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
}

function drawScore(ctx: CanvasRenderingContext2D, score: number, config: GameConfig) {
  const text = score.toString();
  ctx.save();
  ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillText(text, config.width / 2 + 2, 42);

  // Outline
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 6;
  ctx.strokeText(text, config.width / 2, 40);

  // Main text gradient
  const grad = ctx.createLinearGradient(0, 40, 0, 95);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.5, '#FFF8E1');
  grad.addColorStop(1, '#FFE082');
  ctx.fillStyle = grad;
  ctx.fillText(text, config.width / 2, 40);

  ctx.restore();
}

function drawFlash(ctx: CanvasRenderingContext2D, alpha: number, config: GameConfig) {
  if (alpha > 0.01) {
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(0, 0, config.width, config.height);
  }
}

export function render(ctx: CanvasRenderingContext2D, world: GameWorld, config: GameConfig) {
 ctx.save();

  // Screen shake
  if (world.shakeIntensity > 0.5) {
    const sx = (Math.random() - 0.5) * world.shakeIntensity;
    const sy = (Math.random() - 0.5) * world.shakeIntensity;
    ctx.translate(sx, sy);
  }

  // Clear
  ctx.clearRect(-20, -20, config.width + 40, config.height + 40);

  // Background
  drawSky(ctx, config, world);
  drawClouds(ctx, world);

  // Pipes
  for (const pipe of world.pipes) {
    drawPipe(ctx, pipe, config);
  }

  // Particles behind bird
  drawParticles(ctx, world.particles.filter(p => p.type === 'feather'));

  // Bird
  drawBird(ctx, world, config);

  // Particles in front of bird
  drawParticles(ctx, world.particles.filter(p => p.type !== 'feather'));

  // Ground (on top)
  drawGround(ctx, config, world.groundOffset);

  // Score
  if (world.state === 'PLAYING') {
    drawScore(ctx, world.score, config);
  }

  // Flash effect
  drawFlash(ctx, world.flashAlpha, config);

  ctx.restore();
}

export function getCanvasScale(config: GameConfig, containerWidth: number, containerHeight: number) {
  const scaleX = containerWidth / config.width;
  const scaleY = containerHeight / config.height;
  return Math.min(scaleX, scaleY, 2);
}