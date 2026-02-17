
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { LevelData, HookPoint, ObstacleType } from '../types';
import { COLORS, PLAYER_RADIUS, HOOK_SEARCH_RADIUS, GRAVITY } from '../constants';
import { sound } from '../utils/audio';

interface GameCanvasProps {
  level: LevelData;
  onWin: () => void;
  onLose: () => void;
  onRestart: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  level, 
  onWin, 
  onLose, 
  onRestart 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const playerRef = useRef<Matter.Body | null>(null);
  const constraintRef = useRef<Matter.Constraint | null>(null);
  const starsRef = useRef<{x: number, y: number, size: number, speed: number}[]>([]);
  
  const [isHooked, setIsHooked] = useState(false);
  const activeHookPoint = useRef<HookPoint | null>(null);
  const gameActive = useRef(true);

  // Initialize stars once
  useEffect(() => {
    const stars = [];
    for(let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        size: Math.random() * 2,
        speed: Math.random() * 0.5 + 0.1
      });
    }
    starsRef.current = stars;
  }, []);

  const handlePointerDown = useCallback((e?: React.PointerEvent | PointerEvent) => {
    if (e && (e.target as HTMLElement).closest('button')) return;
    if (!playerRef.current || !engineRef.current || constraintRef.current || !gameActive.current) return;
    
    const playerPos = playerRef.current.position;
    let closest: HookPoint | null = null;
    let minDist = HOOK_SEARCH_RADIUS;

    level.hookPoints.forEach(hp => {
      const dx = hp.x - playerPos.x;
      const dy = hp.y - playerPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Reach forward mostly, but allow slightly behind for momentum recovery
      if (dist < minDist && dx > -150) { 
        minDist = dist;
        closest = hp;
      }
    });

    if (closest) {
      sound.playSwing();
      activeHookPoint.current = closest;
      const c = Matter.Constraint.create({ 
        bodyA: playerRef.current, 
        pointB: { x: closest.x, y: closest.y }, 
        stiffness: 0.12, 
        damping: 0.02, 
        length: minDist * 0.75, // Slightly pull the player in for a "snappy" swing
        render: { visible: false } 
      });
      constraintRef.current = c;
      Matter.Composite.add(engineRef.current.world, c);
      setIsHooked(true);
    }
  }, [level.hookPoints]);

  const handlePointerUp = useCallback(() => {
    if (constraintRef.current && engineRef.current) {
      sound.playRelease();
      Matter.Composite.remove(engineRef.current.world, constraintRef.current);
      constraintRef.current = null;
      activeHookPoint.current = null;
      setIsHooked(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { 
        e.preventDefault(); 
        handlePointerDown(); 
      }
      if (e.code === 'KeyR') {
        e.preventDefault();
        onRestart();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') { 
        e.preventDefault(); 
        handlePointerUp(); 
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Handle Window Resize
    const handleResize = () => {
      if (renderRef.current) {
        renderRef.current.canvas.width = window.innerWidth;
        renderRef.current.canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
    };
  }, [handlePointerDown, handlePointerUp, onRestart]);

  const initPhysics = useCallback(() => {
    if (!canvasRef.current) return;
    gameActive.current = true;

    const engine = Matter.Engine.create();
    engineRef.current = engine;
    engine.gravity.y = GRAVITY;

    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: window.innerWidth, 
        height: window.innerHeight,
        wireframes: false, 
        background: 'transparent',
      },
    });
    renderRef.current = render;

    const player = Matter.Bodies.circle(level.spawnPoint.x, level.spawnPoint.y, PLAYER_RADIUS, {
      restitution: 0.35, 
      friction: 0.005, 
      frictionAir: 0.005,
      render: { visible: false }
    });
    playerRef.current = player;
    Matter.Composite.add(engine.world, player);

    // Add static elements
    if (level.bouncers) {
      level.bouncers.forEach(b => {
        Matter.Composite.add(engine.world, Matter.Bodies.rectangle(b.x, b.y, b.width, b.height, { 
          isStatic: true, label: 'bouncer', chamfer: { radius: 10 } 
        }));
      });
    }
    
    if (level.obstacles) {
      level.obstacles.forEach(obs => {
        Matter.Composite.add(engine.world, Matter.Bodies.rectangle(obs.x, obs.y, obs.width, obs.height, { 
          isStatic: true, label: `obs-${obs.type}`, render: { visible: false } 
        }));
      });
    }

    Matter.Events.on(engine, 'afterUpdate', () => {
      if (!gameActive.current || !player) return;
      
      // Death Thresholds
      if (player.position.y > 1200 || player.position.y < -1000) {
        gameActive.current = false;
        sound.playLose();
        onLose();
      }
    });

    Matter.Events.on(engine, 'collisionStart', (event) => {
      if (!gameActive.current) return;
      event.pairs.forEach((pair) => {
        const bodies = [pair.bodyA, pair.bodyB];
        if (bodies.includes(player)) {
          const other = bodies.find(b => b !== player)!;
          if (other.label === 'bouncer') {
            sound.playBouncer();
            const playerAbove = player.position.y < other.position.y;
            Matter.Body.setVelocity(player, { 
              x: player.velocity.x * 1.15, 
              y: playerAbove ? -23 : 23 
            });
          }
          if (other.label === 'obs-HAZARD') { 
            gameActive.current = false;
            sound.playLose(); 
            onLose(); 
          }
        }
      });
    });

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    const draw = () => {
      if (!canvasRef.current || !playerRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      
      const playerPos = playerRef.current.position;
      
      // Adjust offset based on screen width - push player more to the left on desktop
      const horizontalOffset = window.innerWidth < 768 ? window.innerWidth / 4 : window.innerWidth / 3;
      const offsetX = -playerPos.x + horizontalOffset;

      // Draw background
      ctx.fillStyle = COLORS.VOID;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      // Starfield parallax
      starsRef.current.forEach(star => {
        const sx = (star.x - playerPos.x * star.speed) % window.innerWidth;
        const rx = sx < 0 ? sx + window.innerWidth : sx;
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = star.speed + 0.2;
        ctx.beginPath();
        ctx.arc(rx, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Win Condition check
      if (gameActive.current && playerPos.x >= level.finishLineX) {
        gameActive.current = false;
        sound.playWin(); 
        onWin(); 
        return;
      }

      // Draw World Objects
      const allBodies = Matter.Composite.allBodies(engine.world);
      allBodies.forEach(body => {
        const { x, y } = body.position;
        const { min, max } = body.bounds;
        const w = max.x - min.x;
        const h = max.y - min.y;
        const rx = x + offsetX - w/2;
        const ry = y - h/2;

        if (body.label.startsWith('obs-STATION_STRUCTURE')) {
          ctx.save();
          ctx.fillStyle = COLORS.STRUCTURE;
          ctx.fillRect(rx, ry, w, h);
          ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
          ctx.strokeRect(rx, ry, w, h);
          ctx.fillStyle = COLORS.CAUTION;
          const stripeW = 6;
          ctx.fillRect(rx, ry, stripeW, h);
          ctx.fillRect(rx + w - stripeW, ry, stripeW, h);
          ctx.restore();
        } else if (body.label.startsWith('obs-HAZARD')) {
          ctx.save();
          ctx.fillStyle = COLORS.LASER;
          ctx.shadowBlur = 25; ctx.shadowColor = COLORS.LASER;
          ctx.fillRect(rx, ry, w, h);
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
          ctx.strokeRect(rx, ry, w, h);
          ctx.restore();
        } else if (body.label === 'bouncer') {
          ctx.save();
          ctx.fillStyle = COLORS.BOOST;
          ctx.beginPath(); ctx.roundRect(rx, ry, w, h, 10); ctx.fill();
          ctx.shadowBlur = 15; ctx.shadowColor = '#00d2ff';
          ctx.strokeStyle = '#00d2ff'; ctx.lineWidth = 4; ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('BOOST', x + offsetX, y + 6);
          ctx.restore();
        }
      });

      // Finish line checkers
      const checkeredX = level.finishLineX + offsetX;
      const checkerSize = 60;
      for (let r = 0; r < Math.ceil(window.innerHeight / checkerSize); r++) {
        for (let c = 0; c < 2; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#FFFFFF' : '#000000';
          ctx.fillRect(checkeredX + (c * checkerSize), r * checkerSize, checkerSize, checkerSize);
        }
      }

      // Draw Hooks
      level.hookPoints.forEach(hp => {
        ctx.save();
        ctx.shadowBlur = 15; ctx.shadowColor = COLORS.ANCHOR;
        ctx.beginPath(); ctx.arc(hp.x + offsetX, hp.y, 11, 0, Math.PI * 2); ctx.fillStyle = COLORS.ANCHOR; ctx.fill();
        ctx.strokeStyle = '#FFF'; ctx.lineWidth = 4; ctx.stroke();
        ctx.beginPath(); ctx.arc(hp.x + offsetX, hp.y, 25 + Math.sin(Date.now()/200)*12, 0, Math.PI * 2); 
        ctx.strokeStyle = COLORS.ANCHOR_AURA; ctx.lineWidth = 3; ctx.stroke();
        ctx.restore();
      });

      // Draw Player
      ctx.save();
      ctx.translate(playerRef.current.position.x + offsetX, playerRef.current.position.y);
      let rotation = constraintRef.current && activeHookPoint.current 
        ? Math.atan2(activeHookPoint.current.y - playerRef.current.position.y, activeHookPoint.current.x - playerRef.current.position.x) - Math.PI / 2
        : playerRef.current.velocity.x * 0.08;
      ctx.rotate(rotation);
      
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      const phase = Date.now() / 110;
      const swingFactor = !!constraintRef.current ? Math.sin(phase) * 1.8 : Math.sin(phase * 0.5) * 0.2;
      
      ctx.beginPath(); ctx.arc(0, -25, 14, 0, Math.PI * 2); ctx.fillStyle = COLORS.PLAYER; ctx.fill(); ctx.stroke();
      ctx.fillStyle = COLORS.VISOR; ctx.beginPath(); ctx.ellipse(0, -27, 8, 6, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = COLORS.PLAYER; ctx.fillRect(-11, -14, 22, 32); ctx.strokeRect(-11, -14, 22, 32);
      ctx.beginPath(); ctx.moveTo(-8, 18); ctx.lineTo(-18 + swingFactor * 22, 48); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8, 18); ctx.lineTo(18 + swingFactor * 22, 48); ctx.stroke();
      ctx.restore();

      // Draw Tether
      if (constraintRef.current && activeHookPoint.current) {
        ctx.save();
        ctx.beginPath(); 
        ctx.moveTo(playerRef.current.position.x + offsetX, playerRef.current.position.y); 
        ctx.lineTo(activeHookPoint.current.x + offsetX, activeHookPoint.current.y);
        ctx.strokeStyle = COLORS.TETHER; ctx.lineWidth = 6; 
        ctx.setLineDash([15, 10]); 
        ctx.shadowBlur = 20; ctx.shadowColor = COLORS.ANCHOR;
        ctx.stroke(); 
        ctx.restore();
      }
      
      if (gameActive.current) requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);

    return () => {
      Matter.Engine.clear(engine);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      gameActive.current = false;
    };
  }, [level, onWin, onLose]);

  useEffect(() => {
    const cleanup = initPhysics();
    return cleanup;
  }, [initPhysics]);

  return (
    <div 
      className="relative w-full h-full overflow-hidden touch-none" 
      onPointerDown={handlePointerDown} 
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp} // Safety for dragging out
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      
      {/* HUD UI - Completely clean of text except for controls help */}
      <div className="absolute top-0 left-0 w-full p-6 md:p-8 flex justify-end pointer-events-none">
        <div className="flex space-x-3 md:space-x-4 pointer-events-auto">
          <button 
            onClick={(e) => { e.stopPropagation(); onRestart(); }} 
            className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-white/10 hover:bg-[#00D2FF] hover:text-black rounded-2xl md:rounded-3xl text-white transition-all active:scale-90 shadow-xl border border-white/10 backdrop-blur-md"
          >
            <i className="fa-solid fa-rotate-right text-xl md:text-2xl"></i>
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 text-white/30 font-black text-[10px] md:text-xs uppercase tracking-widest pointer-events-none">
        {window.innerWidth < 768 ? 'Tap/Hold' : 'Space/Click'} to Hook • R to Reset
      </div>
    </div>
  );
};

export default GameCanvas;
