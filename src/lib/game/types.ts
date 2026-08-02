export type GameState = 'IDLE' | 'READY' | 'PLAYING' | 'GAME_OVER';

export interface Bird {
  x: number;
  y: number;
  velocity: number;
  rotation: number;
  wingFrame: number;
  wingTimer: number;
  width: number;
  height: number;
}

export interface Pipe {
  x: number;
  gapY: number;
  gapSize: number;
  width: number;
  scored: boolean;
  color: string;
}

export interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
 size: number;
  color: string;
  type: 'spark' | 'feather' | 'star';
}

export interface Star {
  x: number;
  y: number;
  size: number;
  twinkle: number;
  twinkleSpeed: number;
}

export interface GameConfig {
  width: number;
  height: number;
  gravity: number;
  flapStrength: number;
  pipeSpeed: number;
  pipeGap: number;
  pipeWidth: number;
  pipeSpacing: number;
  groundHeight: number;
  birdSize: number;
}

export interface GameWorld {
  bird: Bird;
  pipes: Pipe[];
  clouds: Cloud[];
  particles: Particle[];
  stars: Star[];
  groundOffset: number;
  score: number;
  bestScore: number;
  state: GameState;
  frameCount: number;
  shakeIntensity: number;
  flashAlpha: number;
  combo: number;
  lastScoreTime: number;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  createdAt: string;
}