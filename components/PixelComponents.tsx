import React, { ReactNode } from 'react';
import { Team } from '../types';

// Common style for the NES/Pixel look
const PIXEL_BORDER_CLASS = "border-4 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]";
const ACTIVE_OFFSET = "active:shadow-none active:translate-x-[4px] active:translate-y-[4px]";

interface PixelCardProps {
  children: ReactNode;
  className?: string;
  colorClass?: string;
}

export const PixelCard: React.FC<PixelCardProps> = ({ children, className = "", colorClass = "bg-white" }) => {
  return (
    <div className={`${PIXEL_BORDER_CLASS} ${colorClass} ${className} p-4`}>
      {children}
    </div>
  );
};

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'action';
}

export const PixelButton: React.FC<PixelButtonProps> = ({ children, className = "", variant = 'primary', ...props }) => {
  let bgClass = "bg-blue-500 text-white"; // Primary
  if (variant === 'secondary') bgClass = "bg-gray-200 text-gray-900";
  if (variant === 'danger') bgClass = "bg-red-500 text-white";
  if (variant === 'action') bgClass = "bg-yellow-400 text-black";

  return (
    <button 
      className={`
        ${PIXEL_BORDER_CLASS} 
        ${bgClass} 
        ${ACTIVE_OFFSET}
        px-4 py-2 
        uppercase 
        text-xs md:text-sm 
        transition-transform
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

interface PixelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const PixelInput: React.FC<PixelInputProps> = ({ className = "", ...props }) => {
  return (
    <input 
      className={`
        border-2 border-gray-900 
        shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]
        p-2 
        bg-gray-100 
        text-gray-900
        focus:outline-none focus:bg-white
        ${className}
      `}
      {...props}
    />
  );
};

// --- UPDATED: PIXEL FLAG ---
export const PixelFlag: React.FC<{ team: Team, className?: string }> = ({ team, className = "" }) => {
  const { flagType, colors } = team;
  let backgroundStyle: React.CSSProperties = {};

  // Simple CSS Gradients to simulate flag patterns
  switch (flagType) {
    case 'v-tri': // Vertical Tricolor
      backgroundStyle = { background: `linear-gradient(to right, ${colors[0]} 33.3%, ${colors[1]} 33.3%, ${colors[1]} 66.6%, ${colors[2]} 66.6%)` };
      break;
    case 'h-tri': // Horizontal Tricolor
      backgroundStyle = { background: `linear-gradient(to bottom, ${colors[0]} 33.3%, ${colors[1]} 33.3%, ${colors[1]} 66.6%, ${colors[2]} 66.6%)` };
      break;
    case 'v-bi': // Vertical Bicolor
      backgroundStyle = { background: `linear-gradient(to right, ${colors[0]} 50%, ${colors[1]} 50%)` };
      break;
    case 'h-bi': // Horizontal Bicolor
      backgroundStyle = { background: `linear-gradient(to bottom, ${colors[0]} 50%, ${colors[1]} 50%)` };
      break;
    case 'cross': // Scandinavian Cross
      backgroundStyle = { 
        background: `
          linear-gradient(to right, transparent 35%, ${colors[1]} 35%, ${colors[1]} 50%, transparent 50%),
          linear-gradient(to bottom, ${colors[0]} 40%, ${colors[1]} 40%, ${colors[1]} 60%, ${colors[0]} 60%)
        `,
        backgroundColor: colors[0]
      };
      break;
    case 'usa': 
      backgroundStyle = {
        background: `conic-gradient(from 270deg at 40% 40%, ${colors[0]} 90deg, transparent 0), repeating-linear-gradient(to bottom, ${colors[1]}, ${colors[1]} 8.3%, ${colors[2]} 8.3%, ${colors[2]} 16.6%)`,
        backgroundColor: colors[2]
      };
      break;
    case 'bra':
      backgroundStyle = {
        background: `radial-gradient(circle at center, ${colors[2]} 25%, ${colors[1]} 26%, ${colors[1]} 55%, ${colors[0]} 56%)`,
        backgroundColor: colors[0]
      };
      break;
    case 'circle': // Japan, Korea
        backgroundStyle = {
            background: `radial-gradient(circle at center, ${colors[1]} 40%, ${colors[0]} 41%)`,
            backgroundColor: colors[0]
        };
        break;
    default: // Solid
      backgroundStyle = { backgroundColor: colors[0] };
      break;
  }

  return (
    <div 
      className={`border border-black inline-block shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)] ${className}`}
      style={{
        ...backgroundStyle,
        backgroundSize: '100% 100%',
        boxSizing: 'border-box'
      }}
      title={team.name}
    />
  );
};