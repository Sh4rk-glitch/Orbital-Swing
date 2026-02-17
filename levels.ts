
import { LevelData, HookPoint, Obstacle, ObstacleType, Bouncer } from './types';

export const getLevel = (id: number): LevelData => {
  // Check localStorage for a modified or new level first
  const saved = localStorage.getItem(`orbital_level_${id}`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved level", e);
    }
  }

  // Fallback to procedural generation if not found in storage
  const seed = id * 777.77;
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const levelLength = 2200 + id * 400;
  const hookPoints: HookPoint[] = [];
  const bouncers: Bouncer[] = [];
  const obstacles: Obstacle[] = [];

  let currentX = 400;
  let lastHookY = 300;

  hookPoints.push({ id: 'h-start', x: 250, y: 300 });

  while (currentX < levelLength - 500) {
    const spacing = 400 + (random(seed + currentX) * 150);
    let yPos = 200 + (random(seed + currentX + 1) * 200);
    yPos = (yPos * 0.7 + lastHookY * 0.3);
    lastHookY = yPos;
    
    hookPoints.push({ id: `h-${currentX}`, x: currentX, y: yPos });

    const midX = currentX + spacing / 2;

    if (id >= 2) {
      const roll = random(seed + currentX + 10);
      
      if (roll > 0.85) {
        obstacles.push({
          id: `wall-${currentX}`,
          x: midX,
          y: yPos > 300 ? 0 : 600,
          width: 40,
          height: 500,
          type: ObstacleType.WALL
        });
      } else if (id >= 4 && roll < 0.15) {
        obstacles.push({
          id: `laser-${currentX}`,
          x: midX,
          y: 400,
          width: 15,
          height: 400,
          type: ObstacleType.LASER
        });
      }
    }

    if (random(seed + currentX + 15) > 0.8) {
      bouncers.push({ id: `b-${currentX}`, x: midX, y: 800, width: 150, height: 30 });
    }

    currentX += spacing;
  }

  hookPoints.push({ id: 'h-final', x: levelLength - 300, y: 250 });

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
  return count ? parseInt(count, 10) : 10;
};
