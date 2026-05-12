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
      className={`border border-black inline-flex items-center justify-center bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)] overflow-hidden ${className}`}
      title={team.namePt || team.name}
    >
      {team.crestUrl ? (
        <img 
          src={team.crestUrl} 
          alt={`Bandeira ${team.name}`} 
          className="w-full h-full object-cover" 
          style={{ imageRendering: 'pixelated' }}
        />
      ) : (
        <div style={{ ...backgroundStyle, width: '100%', height: '100%' }} />
      )}
    </div>
  );
};

interface PixelModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

export const PixelModal: React.FC<PixelModalProps> = ({ isOpen, onClose, title, message, type = 'info' }) => {
  if (!isOpen) return null;

  const typeColors = {
    success: { bg: 'bg-green-100', border: 'border-green-600', text: 'text-green-800' },
    error: { bg: 'bg-red-100', border: 'border-red-600', text: 'text-red-800' },
    info: { bg: 'bg-blue-100', border: 'border-blue-600', text: 'text-blue-800' }
  };

  const colors = typeColors[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className={`relative w-full max-w-sm bg-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] p-6 animate-scaleIn`}>
        <div className={`absolute -top-4 left-4 px-3 py-1 bg-black text-white font-bold uppercase text-[10px] tracking-widest`}>
          {type === 'success' ? '✓ Sucesso' : type === 'error' ? '⚠ Erro' : 'ℹ Info'}
        </div>
        
        <h3 className="text-xl font-black uppercase mb-4 tracking-tighter text-gray-900 border-b-2 border-gray-100 pb-2">
          {title}
        </h3>
        
        <div className={`p-4 ${colors.bg} border-2 ${colors.border} mb-6`}>
          <p className="text-sm font-bold uppercase leading-relaxed text-gray-800">
            {message}
          </p>
        </div>
        
        <div className="flex justify-end">
          <PixelButton 
            variant={type === 'error' ? 'danger' : 'action'}
            onClick={onClose}
            className="font-black"
          >
            Entendido
          </PixelButton>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.25s cubic-bezier(0.17, 0.67, 0.83, 0.67) forwards; }
      `}</style>
    </div>
  );
};