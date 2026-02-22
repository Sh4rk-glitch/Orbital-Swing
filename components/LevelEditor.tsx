
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LevelData, HookPoint, Obstacle, ObstacleType, Bouncer, Skin } from '../types';
import GameCanvas from './GameCanvas';
import { SKINS } from '../constants';

interface LevelEditorProps {
  initialLevel?: LevelData | null;
  onSave: (level: LevelData) => void;
  onCancel: () => void;
}

type Tool = 'ANCHOR' | 'WALL' | 'HAZARD' | 'BOUNCER' | 'DELETE';

const LevelEditor: React.FC<LevelEditorProps> = ({ initialLevel, onSave, onCancel }) => {
  const [level, setLevel] = useState<LevelData>(() => initialLevel || {
    id: 11,
    hookPoints: [], 
    finishLineX: 3000,
    spawnPoint: { x: 100, y: 300 },
    bouncers: [],
    obstacles: []
  });

  const [activeTool, setActiveTool] = useState<Tool>('ANCHOR');
  const [viewX, setViewX] = useState(0);
  const [isTesting, setIsTesting] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const lastMouseX = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const handleViewportMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
      lastMouseX.current = e.clientX;
      viewportRef.current?.style.setProperty('cursor', 'grabbing');
    }
  };

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastMouseX.current;
      setViewX(prev => Math.max(0, Math.min(level.finishLineX - 400, prev - deltaX)));
      lastMouseX.current = e.clientX;
    }
  }, [isPanning, level.finishLineX]);

  const handleGlobalMouseUp = useCallback((e: MouseEvent) => {
    if (e.button === 2) {
      setIsPanning(false);
      if (viewportRef.current) viewportRef.current.style.cursor = 'crosshair';
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  const handleViewportClick = (e: React.MouseEvent) => {
    if (isPanning || e.button !== 0 || !viewportRef.current) return;

    const rect = viewportRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) + viewX;
    const clickY = e.clientY - rect.top;

    if (activeTool === 'DELETE') {
      const hitDist = 40;
      setLevel((prev: LevelData) => {
        const newHooks = prev.hookPoints.filter((h: HookPoint) => Math.hypot(h.x - clickX, h.y - clickY) > hitDist);
        const newObs = prev.obstacles?.filter((o: Obstacle) => {
          const withinX = clickX >= o.x - o.width/2 - 20 && clickX <= o.x + o.width/2 + 20;
          const withinY = clickY >= o.y - o.height/2 - 20 && clickY <= o.y + o.height/2 + 20;
          return !(withinX && withinY);
        });
        const newBouncers = prev.bouncers?.filter((b: Bouncer) => {
          const withinX = clickX >= b.x - b.width/2 - 20 && clickX <= b.x + b.width/2 + 20;
          const withinY = clickY >= b.y - b.height/2 - 20 && clickY <= b.y + b.height/2 + 20;
          return !(withinX && withinY);
        });
        return { ...prev, hookPoints: newHooks, obstacles: newObs, bouncers: newBouncers };
      });
      return;
    }

    const id = Date.now().toString();
    if (activeTool === 'ANCHOR') {
      setLevel((prev: LevelData) => ({ ...prev, hookPoints: [...prev.hookPoints, { id, x: clickX, y: clickY }] }));
    } else if (activeTool === 'WALL') {
      setLevel((prev: LevelData) => ({ ...prev, obstacles: [...(prev.obstacles || []), { id, x: clickX, y: clickY, width: 40, height: 400, type: ObstacleType.WALL }] }));
    } else if (activeTool === 'HAZARD') {
      setLevel((prev: LevelData) => ({ ...prev, obstacles: [...(prev.obstacles || []), { id, x: clickX, y: clickY, width: 20, height: 400, type: ObstacleType.LASER }] }));
    } else if (activeTool === 'BOUNCER') {
      setLevel((prev: LevelData) => ({ ...prev, bouncers: [...(prev.bouncers || []), { id, x: clickX, y: clickY, width: 150, height: 30 }] }));
    }
  };

  const handleAutoGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newHookPoints: HookPoint[] = [];
      const newObstacles: Obstacle[] = [];
      const newBouncers: Bouncer[] = [];
      const length = level.finishLineX;
      
      let currX = 400;
      while (currX < length - 450) {
        // Reduced spacing (max 420) to ensure hooks are always reachable
        const spacing = 280 + Math.random() * 140;
        newHookPoints.push({
          id: `h-${currX}`,
          x: currX,
          y: 220 + Math.random() * 260
        });

        if (Math.random() > 0.7) {
          const obsX = currX + spacing / 2;
          const isHazard = Math.random() > 0.8;
          newObstacles.push({
            id: `o-${obsX}`,
            x: obsX,
            y: Math.random() > 0.5 ? 80 : 720,
            width: isHazard ? 20 : 50,
            height: 400,
            type: isHazard ? ObstacleType.LASER : ObstacleType.WALL
          });
        }

        if (Math.random() > 0.85) {
          newBouncers.push({
            id: `b-${currX}`,
            x: currX + spacing / 2,
            y: 880,
            width: 160,
            height: 35
          });
        }
        currX += spacing;
      }

      setLevel((prev: LevelData) => ({
        ...prev,
        hookPoints: newHookPoints,
        obstacles: newObstacles,
        bouncers: newBouncers
      }));
      setIsGenerating(false);
    }, 300);
  };

  const shareLevel = () => {
    const json = JSON.stringify(level);
    const encoded = btoa(json);
    const url = new URL(window.location.href);
    url.searchParams.set('levelData', encoded);
    navigator.clipboard.writeText(url.toString());
    alert("Publish Link copied!");
  };

  if (isTesting) {
    return (
      <div className="w-full h-full relative">
        <GameCanvas 
          level={level} 
          skin={SKINS[0]}
          onWin={() => setIsTesting(false)} 
          onLose={() => setIsTesting(false)} 
          onRestart={() => setIsTesting(false)} 
        />
        <button 
          onClick={() => setIsTesting(false)} 
          className="absolute top-8 left-8 bg-red-600 text-white px-6 py-3 rounded-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase z-[100] flex items-center space-x-2 border-2 border-white/20"
        >
          <i className="fa-solid fa-stop"></i>
          <span>Stop Test</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-[#050510] font-sans">
      {/* Sidebar for Desktop / Header for Mobile */}
      <div className="w-full md:w-64 bg-[#0a0a1a] border-b md:border-b-0 md:border-r border-white/5 p-4 md:p-6 flex flex-row md:flex-col space-x-4 md:space-x-0 md:space-y-4 shrink-0 overflow-x-auto md:overflow-y-auto">
        <div className="hidden md:block">
          <h2 className="text-2xl font-black italic text-cyan-400 leading-none mb-1 uppercase">Blueprint</h2>
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Sector Editor</p>
        </div>

        <div className="flex md:flex-col flex-row space-x-2 md:space-x-0 md:space-y-2">
          {[
            { id: 'ANCHOR', icon: 'fa-anchor', label: 'Anchor', color: 'bg-cyan-500' },
            { id: 'WALL', icon: 'fa-bars', label: 'Wall', color: 'bg-slate-500' },
            { id: 'HAZARD', icon: 'fa-bolt', label: 'Hazard', color: 'bg-red-500' },
            { id: 'BOUNCER', icon: 'fa-chevron-up', label: 'Boost', color: 'bg-blue-600' },
            { id: 'DELETE', icon: 'fa-eraser', label: 'Eraser', color: 'bg-white/10' },
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as Tool)}
              className={`flex-1 md:w-full flex items-center justify-center md:justify-start md:space-x-4 p-3 rounded-xl transition-all border-2 shrink-0 ${activeTool === tool.id ? `${tool.color} text-black border-white` : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10'}`}
            >
              <i className={`fa-solid ${tool.icon} text-lg w-6 text-center`}></i>
              <span className="hidden md:block font-bold text-xs uppercase">{tool.label}</span>
            </button>
          ))}
        </div>

        <div className="flex md:flex-col flex-row space-x-2 md:space-x-0 md:space-y-2 md:pt-4 md:border-t md:border-white/5">
          <button 
            onClick={handleAutoGenerate} 
            disabled={isGenerating}
            className={`px-4 md:px-0 md:w-full py-3 rounded-xl font-black text-[10px] md:text-sm uppercase flex items-center justify-center space-x-2 transition-all shadow-xl
              ${isGenerating ? 'bg-cyan-900/50 text-white/50 cursor-not-allowed' : 'bg-[#00D2FF] text-black hover:scale-105 active:scale-95'}`}
          >
            <i className={`fa-solid ${isGenerating ? 'fa-spinner fa-spin' : 'fa-gear'}`}></i>
            <span className="hidden md:inline">{isGenerating ? 'Generating...' : 'Auto-Build'}</span>
          </button>
        </div>

        <div className="flex md:flex-col flex-row space-x-2 md:space-x-0 md:space-y-3 mt-0 md:mt-auto">
          <button onClick={() => setIsTesting(true)} className="bg-yellow-500 text-black px-4 md:px-0 md:w-full py-3 rounded-xl font-black text-[10px] md:text-sm hover:scale-105 transition-all uppercase flex items-center justify-center space-x-2">
            <i className="fa-solid fa-play"></i> <span className="hidden md:inline">Test</span>
          </button>
          <button onClick={() => onSave(level)} className="bg-green-500 text-black px-4 md:px-0 md:w-full py-3 rounded-xl font-black text-[10px] md:text-sm hover:scale-105 transition-all uppercase flex items-center justify-center space-x-2">
            <i className="fa-solid fa-save"></i> <span className="hidden md:inline">Save</span>
          </button>
          <button onClick={shareLevel} className="bg-purple-600 text-white px-4 md:px-0 md:w-full py-3 rounded-xl font-black text-[10px] md:text-sm hover:bg-purple-500 transition-all uppercase border border-white/10 flex items-center justify-center space-x-2">
            <i className="fa-solid fa-share"></i> <span className="hidden md:inline">Share</span>
          </button>
          <button onClick={onCancel} className="bg-white/5 text-white/40 px-4 md:px-0 md:w-full py-3 rounded-xl font-black text-[10px] md:text-sm hover:bg-white/10 transition-all uppercase border border-white/5 flex items-center justify-center space-x-2">
            <i className="fa-solid fa-arrow-left"></i> <span className="hidden md:inline">Exit Editor</span>
          </button>
        </div>
      </div>

      {/* Editor Main View */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="bg-black/40 p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
               <span className="text-white/40 font-black text-[10px] uppercase tracking-tighter whitespace-nowrap">Sector {level.id}</span>
               <input 
                 type="range" 
                 min="0" 
                 max={Math.max(0, level.finishLineX - 800)} 
                 value={viewX} 
                 onChange={e => setViewX(parseInt(e.target.value))} 
                 className="flex-1 max-w-sm accent-cyan-500"
               />
            </div>
            <div className="ml-4 flex items-center space-x-2">
                <span className="text-[8px] font-bold text-white/20 uppercase hidden md:block">Finish (X)</span>
                <input 
                  type="number" 
                  value={level.finishLineX} 
                  onChange={e => setLevel({...level, finishLineX: parseInt(e.target.value) || 2000})}
                  className="bg-transparent text-cyan-400 font-black text-right outline-none w-16 md:w-20 text-xs"
                />
            </div>
        </div>

        <div 
          ref={viewportRef}
          className="flex-1 relative cursor-crosshair overflow-hidden" 
          onMouseDown={handleViewportMouseDown}
          onClick={handleViewportClick}
          onContextMenu={(e) => e.preventDefault()}
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        >
          {level.hookPoints.map(h => (
            <div key={h.id} className="absolute w-6 h-6 bg-cyan-500 rounded-full border-2 border-white shadow-[0_0_10px_cyan] pointer-events-none" style={{ left: h.x - viewX - 12, top: h.y - 12 }}></div>
          ))}
          {level.obstacles?.filter(o => o.type === ObstacleType.WALL).map(o => (
            <div key={o.id} className="absolute bg-slate-700 border-x-4 border-yellow-500/50 pointer-events-none" style={{ left: o.x - viewX - o.width/2, top: o.y - o.height/2, width: o.width, height: o.height }}></div>
          ))}
          {level.obstacles?.filter(o => o.type === ObstacleType.LASER).map(o => (
            <div key={o.id} className="absolute bg-red-600 shadow-[0_0_20px_red] border-2 border-white/30 pointer-events-none" style={{ left: o.x - viewX - o.width/2, top: o.y - o.height/2, width: o.width, height: o.height }}></div>
          ))}
          {level.bouncers?.map(b => (
            <div key={b.id} className="absolute bg-blue-600 rounded-lg border-b-4 border-cyan-400 flex items-center justify-center text-[8px] font-black pointer-events-none" style={{ left: b.x - viewX - b.width/2, top: b.y - b.height/2, width: b.width, height: b.height }}>BOOST</div>
          ))}
          <div className="absolute w-8 h-8 border-4 border-dashed border-white/20 rounded-full pointer-events-none" style={{ left: level.spawnPoint.x - viewX - 16, top: level.spawnPoint.y - 16 }}></div>
          <div className="absolute top-0 bottom-0 border-l-4 border-dashed border-white/50 flex flex-col pointer-events-none" style={{ left: level.finishLineX - viewX }}>
             <span className="text-[10px] font-black bg-white text-black px-2 py-1 -ml-1">FINISH</span>
          </div>
        </div>
        
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 px-4 md:px-6 py-2 rounded-full border border-white/10 text-[8px] md:text-[10px] font-bold text-white/50 uppercase pointer-events-none shadow-2xl backdrop-blur-md">
          {window.innerWidth < 768 ? 'Tap Grid to Place' : 'Left Click: Place Tool • Right Click: Pan'}
        </div>
      </div>
    </div>
  );
};

export default LevelEditor;
