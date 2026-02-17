
import { LevelData, HookPoint, Obstacle, ObstacleType, Bouncer } from './types';

export const getLevel = (id: number): LevelData => {
  const saved = localStorage.getItem(`orbital_level_${id}`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved level", e);
    }
  }

  const seed = id * 777.77;
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  // Levels get longer as you progress
  const levelLength = 2500 + id * 500;
  const hookPoints: HookPoint[] = [];
  const bouncers: Bouncer[] = [];
  const obstacles: Obstacle[] = [];

  let currentX = 400;
  let lastHookY = 350;

  // Initial starter hook
  hookPoints.push({ id: 'h-start', x: 250, y: 300 });

  while (currentX < levelLength - 600) {
    // Reachable spacing: usually between 350 and 480 pixels
    const spacing = 320 + (random(seed + currentX) * 150);
    
    // Y position constrained to a playable middle band (200 to 500)
    let yPos = 200 + (random(seed + currentX + 1) * 300);
    
    // Smooth vertical transitions so hooks aren't too far apart vertically
    yPos = (yPos * 0.7 + lastHookY * 0.3);
    lastHookY = yPos;
    
    hookPoints.push({ id: `h-${currentX}`, x: currentX, y: yPos });

    const midX = currentX + spacing / 2;

    // Hazards only appear after level 1
    if (id >= 2) {
      const roll = random(seed + currentX + 10);
      if (roll > 0.9) {
        obstacles.push({
          id: `wall-${currentX}`,
          x: midX,
          y: yPos > 350 ? 50 : 700,
          width: 60,
          height: 450,
          type: ObstacleType.WALL
        });
      } else if (id >= 4 && roll < 0.1) {
        obstacles.push({
          id: `laser-${currentX}`,
          x: midX,
          y: 400,
          width: 15,
          height: 300,
          type: ObstacleType.LASER
        });
      }
    }

    // Occasional boost pads to save players falling
    if (random(seed + currentX + 15) > 0.82) {
      bouncers.push({ 
        id: `b-${currentX}`, 
        x: midX, 
        y: 850, 
        width: 180, 
        height: 40 
      });
    }

    currentX += spacing;
  }

  // Guaranteed final hook near finish
  hookPoints.push({ id: 'h-final', x: levelLength - 350, y: 300 });

  return {
    id,
    spawnPoint: { x: 100, y: 300 },
    finishLineX: levelLength,
    hookPoints,
    bouncers,
    obstacles
  };
};

export const getLevelsCount = (): number => {
  const count = localStorage.getItem('orbital_max_levels');
  return count ? parseInt(count, 10) : 12;
};
