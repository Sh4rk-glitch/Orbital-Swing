import React, { useState, useCallback, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import LevelEditor from './components/LevelEditor';
import { GameState, LevelData } from './types';
import { getLevel, getLevelsCount } from './levels';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(() => parseInt(localStorage.getItem('orbital_swing_level_mvp') || '1', 10));
  const [restartKey, setRestartKey] = useState(0);
  const [levelsCount, setLevelsCount] = useState(getLevelsCount());
  const [editingLevel, setEditingLevel] = useState<LevelData | null>(null);

  // Load level from URL if present (for sharing)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedLevelData = params.get('levelData');
    if (sharedLevelData) {
      try {
        const decoded = JSON.parse(atob(sharedLevelData));
        if (confirm(`A shared Sector (${decoded.id}) has been detected. Import to your local map?`)) {
          localStorage.setItem(`orbital_level_${decoded.id}`, JSON.stringify(decoded));
          if (decoded.id > levelsCount) {
            localStorage.setItem('orbital_max_levels', decoded.id.toString());
            setLevelsCount(decoded.id);
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {
        console.error("Failed to decode shared level", e);
      }
    }
  }, [levelsCount]);

  const handleWin = useCallback(() => {
    if (currentLevelId === unlockedLevel) {
      const next = unlockedLevel + 1;
      setUnlockedLevel(next);
      localStorage.setItem('orbital_swing_level_mvp', next.toString());
      if (next > levelsCount) {
        const newMax = next;
        localStorage.setItem('orbital_max_levels', newMax.toString());
        setLevelsCount(newMax);
      }
    }
    setGameState(GameState.LEVEL_COMPLETE);
  }, [currentLevelId, unlockedLevel, levelsCount]);

  const startLevel = (id: number) => {
    setCurrentLevelId(id);
    setRestartKey(k => k + 1);
    setGameState(GameState.PLAYING);
  };

  const handleSaveLevel = (newLevel: LevelData) => {
    localStorage.setItem(`orbital_level_${newLevel.id}`, JSON.stringify(newLevel));
    if (newLevel.id > levelsCount) {
      localStorage.setItem('orbital_max_levels', newLevel.id.toString());
      setLevelsCount(newLevel.id);
    }
    setGameState(GameState.LEVEL_SELECT);
  };

  const openEditorForLevel = (id: number) => {
    if (id > levelsCount) {
      setEditingLevel({
        id,
        hookPoints: [],
        finishLineX: 3000,
        spawnPoint: { x: 100, y: 300 },
        bouncers: [],
        obstacles: []
      });
    } else {
      setEditingLevel(getLevel(id));
    }
    setGameState(GameState.EDITOR);
  };

  const resetLevel = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Reset Sector ${id} to default mission parameters?`)) {
      localStorage.removeItem(`orbital_level_${id}`);
      setRestartKey(k => k + 1); // Refresh UI
    }
  };

  const resetAllData = () => {
    if (confirm("Wipe all local Sector data and progress? This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="w-full h-screen bg-[#050510] text-white font-sans select-none overflow-hidden relative">
      {/* MENU STATE */}
      {gameState === GameState.MENU && (
        <div className="flex flex-col items-center justify-center h-full space-y-12 animate-in fade-in duration-700">
          <div className="text-center">
            <h1 className="text-9xl font-black italic tracking-tighter leading-none">ORBITAL</h1>
            <h1 className="text-9xl font-black italic tracking-tighter leading-none text-[#00D2FF]">SWING</h1>
          </div>
          <p className="text-xl text-white/50 font-bold uppercase tracking-widest">Physics-Based Momentum</p>
          <div className="flex flex-col space-y-4 w-64">
            <button 
              onClick={() => setGameState(GameState.LEVEL_SELECT)} 
              className="bg-[#00D2FF] text-black py-6 rounded-3xl text-2xl font-black shadow-[0_0_50px_rgba(0,210,255,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              LAUNCH
            </button>
            <button 
              onClick={() => openEditorForLevel(levelsCount + 1)}
              className="bg-white/5 text-white/40 py-3 rounded-2xl text-sm font-bold border border-white/10 hover:text-cyan-400 hover:border-cyan-400 transition-all uppercase tracking-widest"
            >
              Design New Sector
            </button>
          </div>
        </div>
      )}

      {/* LEVEL SELECT STATE */}
      {gameState === GameState.LEVEL_SELECT && (
        <div className="flex flex-col h-full p-12 overflow-y-auto animate-in slide-in-from-bottom duration-500">
          <div className="flex justify-between items-center mb-16 w-full max-w-5xl mx-auto">
            <div>
              <h2 className="text-5xl font-black italic tracking-tight text-[#00D2FF] uppercase">Sector Chart</h2>
              <p className="text-white/20 text-xs font-bold uppercase tracking-widest mt-2">Modify or Expand the Map</p>
            </div>
            <div className="flex space-x-4">
              <button onClick={() => openEditorForLevel(levelsCount + 1)} className="bg-cyan-500 text-black p-6 rounded-2xl hover:bg-cyan-400 transition-colors cursor-pointer shadow-[0_0_20px_rgba(0,210,255,0.5)] flex items-center space-x-2">
                <i className="fa-solid fa-plus text-2xl"></i>
              </button>
              <button onClick={() => setGameState(GameState.MENU)} className="bg-white/5 p-6 rounded-2xl hover:bg-white/10 transition-colors border border-white/10">
                <i className="fa-solid fa-house text-2xl"></i>
              </button>
            </div>
          </div>
          
          <div className="max-w-5xl mx-auto w-full">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16 text-center">
              {Array.from({ length: levelsCount }).map((_, i) => {
                const id = i + 1; 
                const isModified = !!localStorage.getItem(`orbital_level_${id}`);
                // Modified/Designed levels are ALWAYS playable, even if ahead of standard progression
                const isLocked = id > unlockedLevel && !isModified;
                
                return (
                  <div key={id} className="relative group">
                    <button 
                      disabled={isLocked} 
                      onClick={() => startLevel(id)} 
                      className={`w-full aspect-square rounded-[2rem] font-black text-4xl flex items-center justify-center transition-all active:scale-90 border-4 cursor-pointer relative
                        ${isLocked 
                          ? 'bg-black/40 border-white/5 opacity-30 grayscale pointer-events-none' 
                          : isModified 
                            ? 'bg-yellow-900/20 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]'
                            : 'bg-cyan-900/20 border-[#00D2FF] text-[#00D2FF] hover:bg-[#00D2FF] hover:text-black hover:shadow-[0_0_30px_rgba(0,210,255,0.3)]'
                        }`}
                    >
                      {isLocked ? <i className="fa-solid fa-lock text-xl"></i> : id}
                      {isModified && !isLocked && (
                        <div className="absolute top-2 left-2 w-3 h-3 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_10px_yellow]" title="Modified"></div>
                      )}
                    </button>
                    
                    {!isLocked && (
                      <div className="absolute -top-3 -right-3 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditorForLevel(id); }}
                          className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:bg-cyan-400 hover:scale-110 transition-all"
                        >
                          <i className="fa-solid fa-pen text-sm"></i>
                        </button>
                        {isModified && (
                          <button 
                            onClick={(e) => resetLevel(id, e)}
                            className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-red-500 hover:scale-110 transition-all"
                          >
                            <i className="fa-solid fa-trash-can text-sm"></i>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-center mt-8">
              <button 
                onClick={resetAllData}
                className="text-white/20 hover:text-red-500 transition-colors text-[10px] font-bold uppercase tracking-widest border border-white/5 px-6 py-2 rounded-full hover:border-red-500/30"
              >
                Clear Local Storage & Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDITOR STATE */}
      {gameState === GameState.EDITOR && (
        <div className="h-full flex items-center justify-center animate-in zoom-in duration-500 overflow-hidden">
          <LevelEditor 
            initialLevel={editingLevel}
            onSave={handleSaveLevel} 
            onCancel={() => setGameState(GameState.LEVEL_SELECT)} 
          />
        </div>
      )}

      {/* PLAYING STATE */}
      {gameState === GameState.PLAYING && (
        <GameCanvas 
          key={restartKey} 
          level={getLevel(currentLevelId)} 
          onWin={handleWin} 
          onLose={() => setGameState(GameState.GAMEOVER)} 
          onRestart={() => setRestartKey(k => k + 1)} 
        />
      )}

      {/* GAME OVER STATE */}
      {gameState === GameState.GAMEOVER && (
        <div className="absolute inset-0 bg-red-950/90 backdrop-blur-xl flex flex-col items-center justify-center z-50 animate-in zoom-in duration-300">
          <h2 className="text-8xl font-black mb-16 italic text-red-500 drop-shadow-2xl uppercase">Signal Lost</h2>
          <div className="flex space-x-6">
            <button 
              onClick={() => startLevel(currentLevelId)} 
              className="bg-[#00D2FF] text-black px-16 py-6 rounded-3xl text-3xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase"
            >
              Reboot
            </button>
            <button 
              onClick={() => setGameState(GameState.LEVEL_SELECT)} 
              className="bg-white/10 px-12 py-6 rounded-3xl text-3xl font-black hover:bg-white/20 transition-all border border-white/20 uppercase"
            >
              Map
            </button>
          </div>
        </div>
      )}

      {/* LEVEL COMPLETE STATE */}
      {gameState === GameState.LEVEL_COMPLETE && (
        <div className="absolute inset-0 bg-cyan-950/80 backdrop-blur-2xl flex flex-col items-center justify-center z-50 animate-in zoom-in duration-300">
          <div className="bg-[#050510] border-8 border-[#00D2FF] p-24 rounded-[4rem] text-center shadow-[0_0_100px_rgba(0,210,255,0.2)]">
            <h2 className="text-8xl font-black mb-16 italic text-[#00D2FF] uppercase">Sector Clear</h2>
            <div className="flex space-x-6 justify-center">
              <button 
                onClick={() => startLevel(currentLevelId + 1)} 
                className="bg-[#00D2FF] text-black py-6 px-16 rounded-3xl text-3xl font-black shadow-2xl hover:scale-110 active:scale-95 transition-all uppercase"
              >
                Next Sector
              </button>
              <button 
                onClick={() => setGameState(GameState.LEVEL_SELECT)} 
                className="bg-white/10 py-6 px-12 rounded-3xl text-3xl font-black border border-white/20 hover:bg-white/20 transition-all uppercase"
              >
                Chart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;