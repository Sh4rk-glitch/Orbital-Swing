
import { Skin } from './types';

export const GRAVITY = 0.85;
export const PLAYER_RADIUS = 18;
export const HOOK_SEARCH_RADIUS = 750;

export const COLORS = {
  PLAYER: '#FFFFFF',
  VISOR: '#111111',
  ANCHOR: '#00D2FF',
  ANCHOR_AURA: 'rgba(0, 210, 255, 0.3)',
  TETHER: 'rgba(0, 210, 255, 0.6)',
  VOID: '#050510',
  BOOST: '#2980b9',
  STRUCTURE: '#2c3e50',
  CAUTION: '#f1c40f',
  LASER: '#ff003c'
};

export const SKINS: Skin[] = [
  {
    id: 'default',
    name: 'Astronaut',
    price: 0,
    color: '#FFFFFF',
    visorColor: '#111111',
    description: 'Standard issue orbital suit.'
  },
  {
    id: 'neon',
    name: 'Neon Pulse',
    price: 50,
    color: '#00FFCC',
    visorColor: '#003322',
    description: 'High-visibility cybernetic plating.'
  },
  {
    id: 'void',
    name: 'Void Stalker',
    price: 100,
    color: '#4A00E0',
    visorColor: '#110033',
    description: 'Absorbs light from the surrounding vacuum.'
  },
  {
    id: 'gold',
    name: 'Solar Flare',
    price: 250,
    color: '#FFD700',
    visorColor: '#443300',
    description: 'Coated in pure solar-reflective gold.'
  },
  {
    id: 'ruby',
    name: 'Crimson Nova',
    price: 500,
    color: '#FF003C',
    visorColor: '#33000C',
    description: 'Experimental high-energy thermal armor.'
  }
];
