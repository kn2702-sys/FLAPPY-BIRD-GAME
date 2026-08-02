'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createConfig, createWorld, flap, getMedal, resetGame, update } from '@/lib/game/engine';
import { render, getCanvasScale } from '@/lib/game/renderer';
import { soundManager } from '@/lib/game/sounds';
import type { GameWorld, GameState, LeaderboardEntry } from '@/lib/game/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Volume2, VolumeX, Play, Crown, Medal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CONFIG = createConfig();
const STORAGE_KEY = 'flappy_best_score';
const SOUND_KEY = 'flappy_sound_enabled';

function loadBestScore(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
}

function loadSoundSetting(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(SOUND_KEY);
  return stored !== null ? stored === 'true' : true;
}

export default function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<GameWorld>(createWorld(loadBestScore()));
  const rafRef = useRef<number>(0);
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(loadBestScore());
  const [soundEnabled, setSoundEnabled] = useState(loadSoundSetting());
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const lastScoreRef = useRef(0);

  // Keep refs in sync for the game loop
  const gameStateRef = useRef(gameState);
  const bestScoreRef = useRef(bestScore);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { bestScoreRef.current = bestScore; }, [bestScore]);

  // Game loop using a stable ref pattern
  const gameLoopRef = useRef<() => void>(() => {});

  useEffect(() => {
    gameLoopRef.current = () => {
      const world = worldRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      update(world, CONFIG);
      render(ctx, world, CONFIG);

      // Sync state to React
      if (world.state !== gameStateRef.current) {
        setGameState(world.state);
      }
      if (world.score !== lastScoreRef.current) {
        lastScoreRef.current = world.score;
        setScore(world.score);
        if (world.state === 'PLAYING') {
          soundManager.score();
        }
      }
      if (world.bestScore > bestScoreRef.current) {
        setBestScore(world.bestScore);
        localStorage.setItem(STORAGE_KEY, String(world.bestScore));
      }

      rafRef.current = requestAnimationFrame(gameLoopRef.current);
    };
  });

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const scale = getCanvasScale(CONFIG, container.clientWidth, container.clientHeight);
    const displayWidth = CONFIG.width * scale;
    const displayHeight = CONFIG.height * scale;

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.width = CONFIG.width;
    canvas.height = CONFIG.height;
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    rafRef.current = requestAnimationFrame(gameLoopRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [handleResize]);

  const handleFlap = useCallback(() => {
    const world = worldRef.current;
    if (world.state === 'IDLE') {
      flap(world, CONFIG);
      soundManager.flap();
    } else if (world.state === 'PLAYING') {
      flap(world, CONFIG);
      soundManager.flap();
    } else if (world.state === 'GAME_OVER') {
      if (world.score > 0) {
        fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: world.score }),
        }).catch(() => {});
      }
      resetGame(world);
      world.bestScore = loadBestScore();
      setScore(0);
      soundManager.swoosh();
    }
  }, []);

  // Input handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleFlap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlap]);

  const handleRestart = useCallback(() => {
    const world = worldRef.current;
    if (world.score > 0) {
      fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: world.score }),
      }).catch(() => {});
    }
    resetGame(world);
    world.bestScore = loadBestScore();
    setScore(0);
    soundManager.swoosh();
  }, []);

  const toggleSound = useCallback(() => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    soundManager.setEnabled(newVal);
    localStorage.setItem(SOUND_KEY, String(newVal));
    soundManager.buttonClick();
  }, [soundEnabled]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/scores');
      const data = await res.json();
      setLeaderboard(data);
    } catch {
      setLeaderboard([]);
    }
  }, []);

  const handleShowLeaderboard = useCallback(() => {
    fetchLeaderboard();
    setShowLeaderboard(true);
    soundManager.buttonClick();
  }, [fetchLeaderboard]);

  const medal = getMedal(score);
  const isNewBest = gameState === 'GAME_OVER' && score > 0 && score >= bestScore;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0d1b2a] to-[#1b2838] select-none overflow-hidden relative">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-emerald-900/20 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-[420px] px-4 mb-3">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-400 font-bold text-sm tracking-wider uppercase">Best: {bestScore}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full w-9 h-9"
            onClick={handleShowLeaderboard}
          >
            <Trophy className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full w-9 h-9"
            onClick={toggleSound}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Game Canvas Container */}
      <div
        ref={containerRef}
        className="relative z-10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border-2 border-white/10"
        style={{
          maxWidth: CONFIG.width,
          maxHeight: 'calc(100vh - 120px)',
          aspectRatio: `${CONFIG.width}/${CONFIG.height}`,
        }}
      >
        <canvas
          ref={canvasRef}
          className="block cursor-pointer touch-none"
          width={CONFIG.width}
          height={CONFIG.height}
          onClick={handleFlap}
          onTouchStart={(e) => {
            e.preventDefault();
            handleFlap();
          }}
        />

        {/* IDLE Overlay */}
        <AnimatePresence>
          {gameState === 'IDLE' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[2px]"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="mb-4"
              >
                <div className="text-6xl">🐦</div>
              </motion.div>

              <motion.h1
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="text-4xl sm:text-5xl font-black text-white tracking-tight"
                style={{
                  textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.5)',
                }}
              >
                Flappy Bird
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/50 text-sm mt-2 mb-8 font-medium"
              >
                Tap or Press Space to Play
              </motion.p>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 15 }}
              >
                <Button
                  size="lg"
                  className="rounded-full px-8 py-6 text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/30 border-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFlap();
                  }}
                >
                  <Play className="w-5 h-5 mr-2" />
                  PLAY
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 text-white/30 text-xs"
              >
                Keyboard: Space / ↑ / W
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GAME OVER Overlay */}
        <AnimatePresence>
          {gameState === 'GAME_OVER' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[3px]"
            >
              {/* Game Over Card */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 w-[85%] max-w-[300px] border border-white/20 shadow-2xl relative"
              >
                <h2 className="text-2xl font-black text-white text-center mb-4 tracking-tight">
                  Game Over
                </h2>

                {/* Score Panel */}
                <div className="bg-black/30 rounded-2xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white/60 text-sm font-medium">Score</span>
                    <span className="text-2xl font-black text-white">{score}</span>
                  </div>
                  <div className="h-px bg-white/10 mb-3" />
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm font-medium">Best</span>
                    <span className="text-2xl font-black text-yellow-400">{bestScore}</span>
                  </div>
                  {isNewBest && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-center mt-2"
                    >
                      <span className="text-xs font-bold text-yellow-300 bg-yellow-400/20 px-3 py-1 rounded-full">
                        NEW BEST!
                      </span>
                    </motion.div>
                  )}
                  {medal && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.4, type: 'spring' }}
                      className="absolute top-4 right-4 text-3xl"
                    >
                      {medal.emoji}
                    </motion.div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    className="flex-1 rounded-xl py-5 font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20 border-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestart();
                    }}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-white/40 text-xs mt-4"
              >
                Tap anywhere to retry
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 mt-4 flex items-center gap-4 text-white/30 text-xs">
        <span>Built with Canvas</span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span>Works on all devices</span>
      </div>

      {/* Leaderboard Dialog */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => {
              setShowLeaderboard(false);
              soundManager.buttonClick();
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-[#1a1f35] rounded-3xl p-6 w-full max-w-[360px] border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-xl font-bold text-white">Leaderboard</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/50 hover:text-white hover:bg-white/10 rounded-full w-8 h-8"
                  onClick={() => {
                    setShowLeaderboard(false);
                    soundManager.buttonClick();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <Medal className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">No scores yet</p>
                  <p className="text-white/25 text-xs mt-1">Play a game to get on the board!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {leaderboard.map((entry, i) => (
                    <motion.div
                      key={entry.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-xl ${
                        i === 0
                          ? 'bg-yellow-400/10 border border-yellow-400/20'
                          : i === 1
                          ? 'bg-gray-400/10 border border-gray-400/10'
                          : i === 2
                          ? 'bg-amber-600/10 border border-amber-600/10'
                          : 'bg-white/5'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0
                          ? 'bg-yellow-400 text-yellow-900'
                          : i === 1
                          ? 'bg-gray-300 text-gray-700'
                          : i === 2
                          ? 'bg-amber-600 text-amber-100'
                          : 'bg-white/10 text-white/50'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="flex-1 text-white/80 text-sm font-medium truncate">
                        {entry.playerName}
                      </span>
                      <span className="text-white font-bold text-sm">{entry.score}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
