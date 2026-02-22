import React from 'react';
import { Skin } from '../types';
import { SKINS } from '../constants';

interface ShopProps {
  coins: number;
  ownedSkins: string[];
  activeSkinId: string;
  onBuySkin: (skin: Skin) => void;
  onSelectSkin: (skinId: string) => void;
  onClose: () => void;
}

const Shop: React.FC<ShopProps> = ({
  coins,
  ownedSkins,
  activeSkinId,
  onBuySkin,
  onSelectSkin,
  onClose
}) => {
  return (
    <div className="flex flex-col h-full p-8 md:p-12 overflow-y-auto animate-in slide-in-from-bottom duration-500 bg-[#050510]">
      <div className="flex justify-between items-center mb-12 w-full max-w-5xl mx-auto">
        <div>
          <h2 className="text-5xl font-black italic tracking-tight text-[#00D2FF] uppercase">Equipment Bay</h2>
          <p className="text-white/20 text-xs font-bold uppercase tracking-widest mt-2">Customize your orbital suit</p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex items-center space-x-3">
            <i className="fa-solid fa-coins text-yellow-500 text-xl"></i>
            <span className="text-2xl font-black text-white">{coins}</span>
          </div>
          <button onClick={onClose} className="bg-white/5 p-6 rounded-2xl hover:bg-white/10 transition-colors border border-white/10">
            <i className="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SKINS.map((skin) => {
          const isOwned = ownedSkins.includes(skin.id);
          const isActive = activeSkinId === skin.id;
          const canAfford = coins >= skin.price;

          return (
            <div 
              key={skin.id} 
              className={`relative p-6 rounded-[2rem] border-2 transition-all flex flex-col space-y-4
                ${isActive 
                  ? 'bg-cyan-900/20 border-[#00D2FF] shadow-[0_0_30px_rgba(0,210,255,0.2)]' 
                  : isOwned 
                    ? 'bg-white/5 border-white/10 hover:border-white/30' 
                    : 'bg-black/40 border-white/5'
                }`}
            >
              <div className="flex justify-between items-start">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: skin.color }}>
                  {/* Mini preview of the skin */}
                  <div className="w-8 h-6 rounded-full absolute top-2" style={{ backgroundColor: skin.visorColor }}></div>
                  <div className="w-10 h-12 bg-white/20 absolute bottom-0 rounded-t-lg"></div>
                </div>
                {isActive && (
                  <span className="bg-[#00D2FF] text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Active</span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">{skin.name}</h3>
                <p className="text-white/40 text-xs mt-1 leading-relaxed">{skin.description}</p>
              </div>

              <div className="mt-auto pt-4">
                {isOwned ? (
                  <button 
                    onClick={() => onSelectSkin(skin.id)}
                    disabled={isActive}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all
                      ${isActive 
                        ? 'bg-white/5 text-white/20 cursor-default' 
                        : 'bg-white text-black hover:scale-105 active:scale-95'
                      }`}
                  >
                    {isActive ? 'Equipped' : 'Equip'}
                  </button>
                ) : (
                  <button 
                    onClick={() => onBuySkin(skin)}
                    disabled={!canAfford}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2
                      ${canAfford 
                        ? 'bg-yellow-500 text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.3)]' 
                        : 'bg-white/5 text-white/20 cursor-not-allowed'
                      }`}
                  >
                    <i className="fa-solid fa-coins text-sm"></i>
                    <span>{skin.price} Coins</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Shop;
