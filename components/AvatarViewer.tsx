import React from 'react';
import {
  faces,
  expressions,
  hairs,
  shirts,
  accessories,
  defaultColors
} from './avatarParts';

export interface AvatarConfig {
  face: number;
  expression: number;
  hair: number;
  shirt: number;
  accessory: number;
  colors: {
    skin: string;
    hair: string;
    eyes: string;
    shirtC1: string;
    shirtC2: string;
    accessory: string;
    background: string;
  };
}

interface AvatarViewerProps {
  configStr: string;
  className?: string;
  size?: number;
}

const GRID = 32;
const PIXEL = 1; // We'll keep viewBox 0 0 32 32 for simplicity
const SVG_SIZE = 32;

function darken(hex: string, amount = 0.25) {
  if (!hex || hex[0] !== '#') return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.round(r * (1 - amount)) || 0;
  const ng = Math.round(g * (1 - amount)) || 0;
  const nb = Math.round(b * (1 - amount)) || 0;
  return `#${Math.max(0, nr).toString(16).padStart(2, '0')}${Math.max(0, ng).toString(16).padStart(2, '0')}${Math.max(0, nb).toString(16).padStart(2, '0')}`;
}

const COLOR_MAP = (colors: any) => ({
  s: colors.skin,
  d: darken(colors.skin, 0.15),
  h: colors.hair,
  w: '#ffffff',
  e: colors.eyes,
  p: '#0f172a',
  m: '#8b3a3a',
  a: colors.shirtC1,
  b: colors.shirtC2,
  o: '#1e293b',
  x: colors.accessory,
});

function compositeGrid(faceIdx: number, expIdx: number, hairIdx: number, shirtIdx: number, accIdx: number) {
  const result: string[][] = [];
  const face = faces[faceIdx] || faces[0];
  const expression = expressions[expIdx] || expressions[0];
  const hair = hairs[hairIdx] || hairs[0];
  const shirt = shirts[shirtIdx] || shirts[0];
  const accessory = accessories[accIdx] || accessories[0];

  for (let r = 0; r < GRID; r++) {
    const row: string[] = [];
    for (let c = 0; c < GRID; c++) {
      const ac = accessory.grid[r]?.[c] || '.';
      const hc = hair.grid[r]?.[c] || '.';
      const ec = expression.grid[r]?.[c] || '.';
      const fc = face.grid[r]?.[c] || '.';
      const sc = shirt.grid[r]?.[c] || '.';

      if (ac !== '.') row.push(ac);
      else if (hc !== '.') row.push(hc);
      else if (ec !== '.') row.push(ec);
      else if (fc !== '.') row.push(fc);
      else if (sc !== '.') row.push(sc);
      else row.push('.');
    }
    result.push(row);
  }
  return result;
}

export const AvatarViewer: React.FC<AvatarViewerProps> = ({ configStr, className = '', size = 50 }) => {
  let config: AvatarConfig | null = null;
  try {
    if (configStr && configStr.startsWith('{')) {
      config = JSON.parse(configStr);
    }
  } catch (e) {
    config = null;
  }

  // Se não houver config ou for o modelo antigo, usa um default ou tenta mapear
  if (!config || !config.colors) {
    // Basic fallback/mapping for old version if needed, otherwise default
    config = {
      face: 0,
      expression: 0,
      hair: 1,
      shirt: 0,
      accessory: 0,
      colors: { ...defaultColors }
    };
  }

  const grid = compositeGrid(config.face, config.expression, config.hair, config.shirt, config.accessory);
  const colorMap: any = COLOR_MAP(config.colors);

  const rects = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const code = grid[r][c];
      if (code === '.') continue;
      const fill = colorMap[code] || '#ff00ff';
      rects.push(
        <rect
          key={`${r}-${c}`}
          x={c * PIXEL}
          y={r * PIXEL}
          width={PIXEL}
          height={PIXEL}
          fill={fill}
        />
      );
    }
  }

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} 
      className={`pixelated ${className}`} 
      style={{ imageRendering: 'pixelated', background: config.colors.background }}
    >
      {rects}
    </svg>
  );
};
